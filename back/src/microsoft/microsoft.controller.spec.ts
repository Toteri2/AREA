import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { ProviderType } from '../shared/enums/provider.enum';
import { MicrosoftController } from './microsoft.controller';
import { MicrosoftService } from './microsoft.service';

describe('MicrosoftController', () => {
  let controller: MicrosoftController;
  let microsoftService: MicrosoftService;
  let authService: AuthService;
  let reactionsService: ReactionsService;
  let configService: ConfigService;
  let hooksRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MicrosoftController],
      providers: [
        {
          provide: MicrosoftService,
          useValue: {
            listUserWebhooks: jest.fn(),
            createWebhook: jest.fn(),
            deleteSubscription: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Hook),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getMicrosoftToken: jest.fn(),
            findOauthState: jest.fn(),
            createOAuthStateToken: jest.fn(),
          },
        },
        {
          provide: ReactionsService,
          useValue: {
            findByHookId: jest.fn(),
            executeReaction: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MICROSOFT_CLIENT_ID: 'test-microsoft-id',
                MICROSOFT_CLIENT_SECRET: 'test-microsoft-secret',
                MICROSOFT_WEBHOOK_URL: 'https://test.webhook.url',
              };
              return config[key];
            }),
            getOrThrow: jest.fn((key: string) => {
              const config = {
                MICROSOFT_CLIENT_ID: 'test-microsoft-id',
                MICROSOFT_CLIENT_SECRET: 'test-microsoft-secret',
                MICROSOFT_WEBHOOK_URL: 'https://test.webhook.url',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<MicrosoftController>(MicrosoftController);
    microsoftService = module.get<MicrosoftService>(MicrosoftService);
    authService = module.get<AuthService>(AuthService);
    reactionsService = module.get<ReactionsService>(ReactionsService);
    configService = module.get<ConfigService>(ConfigService);
    hooksRepository = module.get(getRepositoryToken(Hook));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('webhook', () => {
    it('should return validation token when provided', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const token = 'validation-token-123';

      await controller.webhook({}, res, token);

      expect(res.send).toHaveBeenCalledWith(token);
    });

    it('should handle webhook event with valid oauth state', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const body = {
        value: [
          {
            clientState: 'test-client-state',
            subscriptionId: 'sub-123',
          },
        ],
      };
      const hook = {
        id: 1,
        userId: 1,
        webhookId: 'sub-123',
        service: 'microsoft',
      };
      const reactions = [
        {
          id: 1,
          action: 'test',
          userId: 1,
          hookId: 1,
          service: 'test',
          config: {},
        } as any,
        {
          id: 2,
          action: 'test2',
          userId: 1,
          hookId: 1,
          service: 'test',
          config: {},
        } as any,
      ];

      jest
        .spyOn(authService, 'findOauthState')
        .mockResolvedValue({ id: 1 } as any);
      jest.spyOn(hooksRepository, 'findOne').mockResolvedValue(hook);
      jest.spyOn(reactionsService, 'findByHookId').mockResolvedValue(reactions);
      jest
        .spyOn(reactionsService, 'executeReaction')
        .mockResolvedValue(undefined);

      await controller.webhook(body, res, '');

      expect(authService.findOauthState).toHaveBeenCalledWith(
        'test-client-state',
        ProviderType.MICROSOFT
      );
      expect(hooksRepository.findOne).toHaveBeenCalledWith({
        where: { webhookId: 'sub-123', service: 'microsoft' },
      });
      expect(reactionsService.findByHookId).toHaveBeenCalledWith(1);
      expect(reactionsService.executeReaction).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('should handle webhook event when reaction execution fails', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const body = {
        value: [
          {
            clientState: 'test-client-state',
            subscriptionId: 'sub-123',
          },
        ],
      };
      const hook = {
        id: 1,
        userId: 1,
        webhookId: 'sub-123',
        service: 'microsoft',
      };
      const reactions = [
        {
          id: 1,
          action: 'test',
          userId: 1,
          hookId: 1,
          service: 'test',
          config: {},
        } as any,
      ];

      jest
        .spyOn(authService, 'findOauthState')
        .mockResolvedValue({ id: 1 } as any);
      jest.spyOn(hooksRepository, 'findOne').mockResolvedValue(hook);
      jest.spyOn(reactionsService, 'findByHookId').mockResolvedValue(reactions);
      jest
        .spyOn(reactionsService, 'executeReaction')
        .mockRejectedValue(new Error('Execution failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await controller.webhook(body, res, '');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to execute reaction 1:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle webhook event with no oauth state', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const body = {
        value: [
          {
            clientState: 'invalid-state',
            subscriptionId: 'sub-123',
          },
        ],
      };

      jest.spyOn(authService, 'findOauthState').mockResolvedValue(null as any);

      await controller.webhook(body, res, '');

      expect(authService.findOauthState).toHaveBeenCalledWith(
        'invalid-state',
        ProviderType.MICROSOFT
      );
      expect(hooksRepository.findOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('listUserWebhooks', () => {
    it('should list user webhooks', async () => {
      const req = { user: { id: 1 } };
      const webhooks = [{ id: '1' }, { id: '2' }];

      jest
        .spyOn(authService, 'getMicrosoftToken')
        .mockResolvedValue('test-token');
      jest
        .spyOn(microsoftService, 'listUserWebhooks')
        .mockResolvedValue(webhooks as any);

      const result = await controller.listUserWebhooks(req);

      expect(authService.getMicrosoftToken).toHaveBeenCalledWith(1);
      expect(microsoftService.listUserWebhooks).toHaveBeenCalledWith(
        'test-token'
      );
      expect(result).toEqual(webhooks);
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const req = { user: { id: 1 } };
      const body = { resource: 'test-resource' };
      const webhook = { id: 'webhook-123' };

      jest
        .spyOn(configService, 'getOrThrow')
        .mockReturnValue('https://test.webhook.url');
      jest
        .spyOn(authService, 'getMicrosoftToken')
        .mockResolvedValue('test-token');
      jest
        .spyOn(authService, 'createOAuthStateToken')
        .mockResolvedValue('oauth-state-token');
      jest
        .spyOn(microsoftService, 'createWebhook')
        .mockResolvedValue(webhook as any);

      const result = await controller.createWebhook(req, body as any);

      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'MICROSOFT_WEBHOOK_URL'
      );
      expect(authService.getMicrosoftToken).toHaveBeenCalledWith(1);
      expect(authService.createOAuthStateToken).toHaveBeenCalledWith(
        1,
        ProviderType.MICROSOFT
      );
      expect(microsoftService.createWebhook).toHaveBeenCalledWith(
        body,
        'test-token',
        'https://test.webhook.url',
        1,
        'oauth-state-token'
      );
      expect(result).toEqual(webhook);
    });
  });

  describe('deleteSubscription', () => {
    it('should delete a subscription successfully', async () => {
      const req = { user: { id: 1 } };
      const hookId = 1;
      const mockHook = {
        id: hookId,
        userId: 1,
        webhookId: 'sub-123',
        service: 'microsoft',
      };

      jest.spyOn(hooksRepository, 'findOne').mockResolvedValue(mockHook);
      jest
        .spyOn(authService, 'getMicrosoftToken')
        .mockResolvedValue('test-token');
      jest
        .spyOn(microsoftService, 'deleteSubscription')
        .mockResolvedValue(undefined);

      const result = await controller.deleteSubscription(req, hookId);

      expect(hooksRepository.findOne).toHaveBeenCalledWith({
        where: { id: hookId, userId: 1, service: 'microsoft' },
      });
      expect(authService.getMicrosoftToken).toHaveBeenCalledWith(1);
      expect(microsoftService.deleteSubscription).toHaveBeenCalledWith(
        'sub-123',
        'test-token'
      );
      expect(result).toEqual({ message: 'Subscription deleted' });
    });

    it('should throw NotFoundException when hook not found', async () => {
      const req = { user: { id: 1 } };
      const hookId = 1;

      jest.spyOn(hooksRepository, 'findOne').mockResolvedValue(null);

      await expect(controller.deleteSubscription(req, hookId)).rejects.toThrow(
        'Hook not found'
      );
    });
  });
});

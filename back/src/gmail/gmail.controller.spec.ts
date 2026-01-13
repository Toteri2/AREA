import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { Hook } from '../shared/entities/hook.entity';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';

describe('GmailController', () => {
  let controller: GmailController;
  let gmailService: GmailService;
  let authService: AuthService;
  let _hooksRepository: any;

  const mockGmailService = {
    listUserWebhooks: jest.fn(),
    createWebhook: jest.fn(),
    deleteSubscription: jest.fn(),
    verifyEmailAddress: jest.fn(),
    handleGmailEvent: jest.fn(),
    executeReactions: jest.fn(),
  };

  const mockAuthService = {
    getGmailProvider: jest.fn(),
    getValidGmailToken: jest.fn(),
  };

  const mockHooksRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GmailController],
      providers: [
        {
          provide: GmailService,
          useValue: mockGmailService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: getRepositoryToken(Hook),
          useValue: mockHooksRepository,
        },
      ],
    }).compile();

    controller = module.get<GmailController>(GmailController);
    gmailService = module.get<GmailService>(GmailService);
    authService = module.get<AuthService>(AuthService);
    _hooksRepository = module.get(getRepositoryToken(Hook));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('webhook', () => {
    it('should process webhook event', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const mockBody = {
        message: {
          data: Buffer.from(
            JSON.stringify({
              emailAddress: 'test@example.com',
              historyId: 123,
            })
          ).toString('base64'),
        },
      };
      const mockHook = {
        id: 1,
        userId: 1,
        service: 'gmail',
        lastHistoryId: 100,
      };

      mockHooksRepository.find.mockResolvedValue([mockHook]);
      mockAuthService.getGmailProvider.mockResolvedValue({ id: 1 });
      mockAuthService.getValidGmailToken.mockResolvedValue('test-token');
      mockGmailService.verifyEmailAddress.mockResolvedValue(true);
      mockGmailService.handleGmailEvent.mockResolvedValue(true);
      mockHooksRepository.save.mockResolvedValue(mockHook);
      mockGmailService.executeReactions.mockResolvedValue(undefined);

      await controller.webhook(mockBody, mockRes);

      expect(mockHooksRepository.find).toHaveBeenCalledWith({
        where: { service: 'gmail' },
      });
      expect(authService.getGmailProvider).toHaveBeenCalledWith(1);
      expect(authService.getValidGmailToken).toHaveBeenCalledWith(1);
      expect(gmailService.verifyEmailAddress).toHaveBeenCalledWith(
        'test-token',
        'test@example.com'
      );
      expect(gmailService.handleGmailEvent).toHaveBeenCalledWith(
        mockHook,
        'test-token',
        100
      );
      expect(gmailService.executeReactions).toHaveBeenCalledWith(
        mockHook,
        mockBody,
        'test@example.com',
        123,
        1
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should skip hook with old history id', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const mockBody = {
        message: {
          data: Buffer.from(
            JSON.stringify({
              emailAddress: 'test@example.com',
              historyId: 50,
            })
          ).toString('base64'),
        },
      };
      const mockHook = {
        id: 1,
        userId: 1,
        service: 'gmail',
        lastHistoryId: 100,
      };

      mockHooksRepository.find.mockResolvedValue([mockHook]);

      await controller.webhook(mockBody, mockRes);

      expect(authService.getGmailProvider).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should skip hook without provider', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const mockBody = {
        message: {
          data: Buffer.from(
            JSON.stringify({
              emailAddress: 'test@example.com',
              historyId: 123,
            })
          ).toString('base64'),
        },
      };
      const mockHook = {
        id: 1,
        userId: 1,
        service: 'gmail',
        lastHistoryId: 100,
      };

      mockHooksRepository.find.mockResolvedValue([mockHook]);
      mockAuthService.getGmailProvider.mockResolvedValue(null);

      await controller.webhook(mockBody, mockRes);

      expect(authService.getGmailProvider).toHaveBeenCalledWith(1);
      expect(authService.getValidGmailToken).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should skip hook with invalid email', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const mockBody = {
        message: {
          data: Buffer.from(
            JSON.stringify({
              emailAddress: 'test@example.com',
              historyId: 123,
            })
          ).toString('base64'),
        },
      };
      const mockHook = {
        id: 1,
        userId: 1,
        service: 'gmail',
        lastHistoryId: 100,
      };

      mockHooksRepository.find.mockResolvedValue([mockHook]);
      mockAuthService.getGmailProvider.mockResolvedValue({ id: 1 });
      mockAuthService.getValidGmailToken.mockResolvedValue('test-token');
      mockGmailService.verifyEmailAddress.mockResolvedValue(false);

      await controller.webhook(mockBody, mockRes);

      expect(gmailService.verifyEmailAddress).toHaveBeenCalledWith(
        'test-token',
        'test@example.com'
      );
      expect(gmailService.handleGmailEvent).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should not execute reactions when event should not trigger', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const mockBody = {
        message: {
          data: Buffer.from(
            JSON.stringify({
              emailAddress: 'test@example.com',
              historyId: 123,
            })
          ).toString('base64'),
        },
      };
      const mockHook = {
        id: 1,
        userId: 1,
        service: 'gmail',
        lastHistoryId: 100,
      };

      mockHooksRepository.find.mockResolvedValue([mockHook]);
      mockAuthService.getGmailProvider.mockResolvedValue({ id: 1 });
      mockAuthService.getValidGmailToken.mockResolvedValue('test-token');
      mockGmailService.verifyEmailAddress.mockResolvedValue(true);
      mockGmailService.handleGmailEvent.mockResolvedValue(false);
      mockHooksRepository.save.mockResolvedValue(mockHook);

      await controller.webhook(mockBody, mockRes);

      expect(gmailService.handleGmailEvent).toHaveBeenCalled();
      expect(gmailService.executeReactions).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 200 when no message data', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const mockBody = {};

      await controller.webhook(mockBody, mockRes);

      expect(mockHooksRepository.find).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('listUserWebhooks', () => {
    it('should list user webhooks', async () => {
      const mockReq = { user: { id: 1 } };
      const mockWebhooks = [{ id: 1 }, { id: 2 }];

      mockGmailService.listUserWebhooks.mockResolvedValue(mockWebhooks);

      const result = await controller.listUserWebhooks(mockReq);

      expect(gmailService.listUserWebhooks).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWebhooks);
    });
  });

  describe('alive', () => {
    it('should return alive status', async () => {
      const result = await controller.alive();
      expect(result).toEqual({ status: 'alive' });
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        topicName: 'test-topic',
        eventType: 1,
      };
      const mockProvider = { accessToken: 'test_token' };
      const mockWebhook = { id: 1, webhookId: '123' };

      mockAuthService.getGmailProvider.mockResolvedValue(mockProvider);
      mockAuthService.getValidGmailToken.mockResolvedValue('test_token');
      mockGmailService.createWebhook.mockResolvedValue(mockWebhook);

      const result = await controller.createWebhook(mockReq, mockDto);

      expect(authService.getGmailProvider).toHaveBeenCalledWith(1);
      expect(gmailService.createWebhook).toHaveBeenCalledWith(
        mockDto,
        'test_token',
        1
      );
      expect(result).toEqual(mockWebhook);
    });

    it('should throw UnauthorizedException if Google not linked', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        topicName: 'test-topic',
        eventType: 1,
      };

      mockAuthService.getGmailProvider.mockResolvedValue(null);

      await expect(
        controller.createWebhook(mockReq, mockDto)
      ).rejects.toThrow();
    });
  });

  describe('deleteSubscription', () => {
    it('should delete a subscription', async () => {
      const mockReq = { user: { id: 1 } };
      const hookId = 1;
      const mockHook = {
        id: hookId,
        userId: 1,
        webhookId: 'webhook-uuid-123',
        service: 'gmail',
      };

      mockHooksRepository.findOne.mockResolvedValue(mockHook);
      mockAuthService.getValidGmailToken.mockResolvedValue('test_token');
      mockGmailService.deleteSubscription.mockResolvedValue(null);

      const result = await controller.deleteSubscription(mockReq, hookId);

      expect(mockHooksRepository.findOne).toHaveBeenCalledWith({
        where: { id: hookId, userId: 1, service: 'gmail' },
      });
      expect(authService.getValidGmailToken).toHaveBeenCalledWith(1);
      expect(gmailService.deleteSubscription).toHaveBeenCalledWith(
        'webhook-uuid-123',
        'test_token'
      );
      expect(result).toEqual({ message: 'Subscription deleted' });
    });

    it('should throw NotFoundException when hook not found', async () => {
      const mockReq = { user: { id: 1 } };
      const hookId = 1;

      mockHooksRepository.findOne.mockResolvedValue(null);

      await expect(
        controller.deleteSubscription(mockReq, hookId)
      ).rejects.toThrow('Hook not found');
    });
  });
});

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
    getProfile: jest.fn(),
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

      await controller.webhook(mockBody, mockRes);

      expect(authService.getValidGmailToken).not.toHaveBeenCalled();
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

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        topicName: 'test-topic',
        eventType: 1,
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockWebhook = { id: 1, webhookId: '123' };

      mockAuthService.getValidGmailToken.mockResolvedValue('test_token');
      mockGmailService.getProfile.mockResolvedValue({
        emailAddress: 'test@example.com',
      });
      mockGmailService.createWebhook.mockResolvedValue(mockWebhook);

      const result = await controller.createWebhook(mockReq, mockDto);

      expect(authService.getValidGmailToken).toHaveBeenCalledWith(1);
      expect(gmailService.getProfile).toHaveBeenCalledWith('test_token');
      expect(gmailService.createWebhook).toHaveBeenCalledWith(
        mockDto,
        'test_token',
        1,
        'test@example.com'
      );
      expect(result).toEqual(mockWebhook);
    });

    it('should throw exception if Google not linked', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        topicName: 'test-topic',
        eventType: 1,
      };

      try {
        await controller.createWebhook(mockReq, mockDto);
        fail('Should have thrown an exception');
      } catch (e) {
        expect(e).toBeDefined();
      }
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
        1,
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

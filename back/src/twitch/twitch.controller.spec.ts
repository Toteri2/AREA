import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { TwitchController } from './twitch.controller';
import { TwitchService } from './twitch.service';

describe('TwitchController', () => {
  let controller: TwitchController;
  let _twitchService: TwitchService;
  let _authService: AuthService;
  let _reactionsService: ReactionsService;
  let _configService: ConfigService;

  const mockTwitchService = {
    getCurrentUser: jest.fn(),
    getFollowedChannels: jest.fn(),
    getServiceMetadata: jest.fn(),
    createWebhook: jest.fn(),
    verifyWebhookSignature: jest.fn(),
    getBroadcasterName: jest.fn(),
  };

  const mockAuthService = {
    getTwitchProvider: jest.fn(),
  };

  const mockReactionsService = {
    findByHookId: jest.fn(),
    executeReaction: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  const mockHooksRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwitchController],
      providers: [
        {
          provide: TwitchService,
          useValue: mockTwitchService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ReactionsService,
          useValue: mockReactionsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(Hook),
          useValue: mockHooksRepository,
        },
      ],
    }).compile();

    controller = module.get<TwitchController>(TwitchController);
    _twitchService = module.get<TwitchService>(TwitchService);
    _authService = module.get<AuthService>(AuthService);
    _reactionsService = module.get<ReactionsService>(ReactionsService);
    _configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return current user information', async () => {
      const req = { user: { id: 1 } };
      const provider = { accessToken: 'test-token' };
      const userData = { data: [{ id: 'user123', login: 'testuser' }] };

      mockAuthService.getTwitchProvider.mockResolvedValue(provider);
      mockTwitchService.getCurrentUser.mockResolvedValue(userData);

      const result = await controller.getCurrentUser(req);

      expect(mockAuthService.getTwitchProvider).toHaveBeenCalledWith(1);
      expect(mockTwitchService.getCurrentUser).toHaveBeenCalledWith(
        'test-token'
      );
      expect(result).toEqual(userData);
    });

    it('should throw UnauthorizedException when provider not found', async () => {
      const req = { user: { id: 1 } };
      mockAuthService.getTwitchProvider.mockResolvedValue(null);

      await expect(controller.getCurrentUser(req)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('getFollowedChannels', () => {
    it('should return followed channels', async () => {
      const req = { user: { id: 1 } };
      const provider = { accessToken: 'test-token' };
      const userData = { data: [{ id: 'user123' }] };
      const followedChannels = {
        data: [{ broadcaster_id: 'channel1', broadcaster_name: 'Channel1' }],
      };

      mockAuthService.getTwitchProvider.mockResolvedValue(provider);
      mockTwitchService.getCurrentUser.mockResolvedValue(userData);
      mockTwitchService.getFollowedChannels.mockResolvedValue(followedChannels);

      const result = await controller.getFollowedChannels(req);

      expect(mockAuthService.getTwitchProvider).toHaveBeenCalledWith(1);
      expect(mockTwitchService.getCurrentUser).toHaveBeenCalledWith(
        'test-token'
      );
      expect(mockTwitchService.getFollowedChannels).toHaveBeenCalledWith(
        'test-token',
        'user123'
      );
      expect(result).toEqual(followedChannels);
    });

    it('should throw UnauthorizedException when provider not found', async () => {
      const req = { user: { id: 1 } };
      mockAuthService.getTwitchProvider.mockResolvedValue(null);

      await expect(controller.getFollowedChannels(req)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('createWebhook', () => {
    it('should create webhook successfully', async () => {
      const req = { user: { id: 1 } };
      const provider = { accessToken: 'test-token' };
      const createWebhookDto = {
        broadcasterUserId: 'broadcaster123',
        eventType: 'stream.online',
      };
      const webhookResult = {
        data: [{ id: 'subscription123' }],
      };
      const hook = {
        id: 1,
        userId: 1,
        webhookId: 'subscription123',
        service: 'twitch',
      };

      mockAuthService.getTwitchProvider.mockResolvedValue(provider);
      mockConfigService.getOrThrow.mockReturnValue(
        'https://example.com/webhook'
      );
      mockTwitchService.createWebhook.mockResolvedValue(webhookResult);
      mockTwitchService.getBroadcasterName.mockResolvedValue({
        display_name: 'TestBroadcaster',
        login: 'testbroadcaster',
      });
      mockHooksRepository.create.mockReturnValue(hook);
      mockHooksRepository.save.mockResolvedValue(hook);

      const result = await controller.createWebhook(req, createWebhookDto);

      expect(mockAuthService.getTwitchProvider).toHaveBeenCalledWith(1);
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(
        'TWITCH_WEBHOOK_CALLBACK_URL'
      );
      expect(mockTwitchService.createWebhook).toHaveBeenCalledWith(
        createWebhookDto,
        'https://example.com/webhook'
      );
      expect(mockTwitchService.getBroadcasterName).toHaveBeenCalledWith(
        'test-token',
        'broadcaster123'
      );
      expect(mockHooksRepository.create).toHaveBeenCalledWith({
        userId: 1,
        webhookId: 'subscription123',
        service: 'twitch',
        additionalInfos: {
          broadcasterUserId: 'broadcaster123',
          broadcasterName: 'TestBroadcaster',
          broadcasterLogin: 'testbroadcaster',
          events: ['stream.online'],
        },
      });
      expect(result).toEqual({ result: webhookResult, hookId: 1 });
    });

    it('should throw UnauthorizedException when provider not found', async () => {
      const req = { user: { id: 1 } };
      const createWebhookDto = {
        broadcasterUserId: 'broadcaster123',
        eventType: 'stream.online',
      };
      mockAuthService.getTwitchProvider.mockResolvedValue(null);

      await expect(
        controller.createWebhook(req, createWebhookDto)
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('webhook', () => {
    it('should handle webhook_callback_verification', async () => {
      const messageId = 'msg123';
      const timestamp = '2023-01-01T00:00:00Z';
      const signature = 'sha256=test';
      const messageType = 'webhook_callback_verification';
      const subscriptionType = 'stream.online';
      const body = { challenge: 'test-challenge' };
      const res = {
        set: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await controller.webhook(
        messageId,
        timestamp,
        signature,
        messageType,
        subscriptionType,
        body,
        res
      );

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('test-challenge');
    });

    it('should throw BadRequestException for invalid signature', async () => {
      const messageId = 'msg123';
      const timestamp = '2023-01-01T00:00:00Z';
      const signature = 'sha256=invalid';
      const messageType = 'notification';
      const subscriptionType = 'stream.online';
      const body = { event: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      mockTwitchService.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        controller.webhook(
          messageId,
          timestamp,
          signature,
          messageType,
          subscriptionType,
          body,
          res
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle notification and execute reactions', async () => {
      const messageId = 'msg123';
      const timestamp = '2023-01-01T00:00:00Z';
      const signature = 'sha256=valid';
      const messageType = 'notification';
      const subscriptionType = 'stream.online';
      const body = {
        subscription: { id: 'sub123' },
        event: { broadcaster_user_id: 'broadcaster123' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const hooks = [{ id: 1, userId: 1, webhookId: 'sub123' }];
      const reactions = [
        {
          id: 1,
          service: 'discord',
          action: 'send_message',
          hookId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as any,
      ];

      mockTwitchService.verifyWebhookSignature.mockReturnValue(true);
      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockResolvedValue(reactions);
      mockReactionsService.executeReaction.mockResolvedValue(undefined);

      await controller.webhook(
        messageId,
        timestamp,
        signature,
        messageType,
        subscriptionType,
        body,
        res
      );

      expect(mockTwitchService.verifyWebhookSignature).toHaveBeenCalledWith(
        messageId,
        timestamp,
        JSON.stringify(body),
        signature
      );
      expect(mockHooksRepository.find).toHaveBeenCalledWith({
        where: { webhookId: 'sub123', service: 'twitch' },
      });
      expect(mockReactionsService.findByHookId).toHaveBeenCalledWith(1);
      expect(mockReactionsService.executeReaction).toHaveBeenCalledWith(
        reactions[0],
        body,
        1
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('should handle notification without subscription', async () => {
      const messageId = 'msg123';
      const timestamp = '2023-01-01T00:00:00Z';
      const signature = 'sha256=valid';
      const messageType = 'notification';
      const subscriptionType = 'stream.online';
      const body = { event: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      mockTwitchService.verifyWebhookSignature.mockReturnValue(true);

      await controller.webhook(
        messageId,
        timestamp,
        signature,
        messageType,
        subscriptionType,
        body,
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
      expect(mockHooksRepository.find).not.toHaveBeenCalled();
    });

    it('should handle revocation message', async () => {
      const messageId = 'msg123';
      const timestamp = '2023-01-01T00:00:00Z';
      const signature = 'sha256=valid';
      const messageType = 'revocation';
      const subscriptionType = 'stream.online';
      const body = { subscription: { id: 'sub123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      mockTwitchService.verifyWebhookSignature.mockReturnValue(true);

      await controller.webhook(
        messageId,
        timestamp,
        signature,
        messageType,
        subscriptionType,
        body,
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('should handle reaction execution error gracefully', async () => {
      const messageId = 'msg123';
      const timestamp = '2023-01-01T00:00:00Z';
      const signature = 'sha256=valid';
      const messageType = 'notification';
      const subscriptionType = 'stream.online';
      const body = {
        subscription: { id: 'sub123' },
        event: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const hooks = [{ id: 1, userId: 1, webhookId: 'sub123' }];
      const reactions = [
        {
          id: 1,
          service: 'discord',
          action: 'send_message',
          hookId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as any,
      ];

      mockTwitchService.verifyWebhookSignature.mockReturnValue(true);
      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockResolvedValue(reactions);
      mockReactionsService.executeReaction.mockRejectedValue(
        new Error('Execution failed')
      );

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await controller.webhook(
        messageId,
        timestamp,
        signature,
        messageType,
        subscriptionType,
        body,
        res
      );

      expect(consoleSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });

      consoleSpy.mockRestore();
    });
  });
});

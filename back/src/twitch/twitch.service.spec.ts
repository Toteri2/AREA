import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import * as crypto from 'crypto';
import { TwitchService } from './twitch.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TwitchService', () => {
  let service: TwitchService;
  let _configService: ConfigService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config = {
        TWITCH_WEBHOOK_SECRET: 'test-webhook-secret',
        TWITCH_CLIENT_ID: 'test-client-id',
        TWITCH_CLIENT_SECRET: 'test-client-secret',
      };
      return config[key] || `test-${key}`;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitchService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TwitchService>(TwitchService);
    _configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const userAccessToken = 'user-token';
      const userData = {
        data: [{ id: 'user123', login: 'testuser', display_name: 'TestUser' }],
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: userData,
      });

      const result = await service.getCurrentUser(userAccessToken);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users',
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
            'Client-Id': 'test-client-id',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(userData);
    });

    it('should return null for 204 response', async () => {
      const userAccessToken = 'user-token';

      mockedAxios.get.mockResolvedValue({
        status: 204,
        data: null,
      });

      const result = await service.getCurrentUser(userAccessToken);

      expect(result).toBeNull();
    });
  });

  describe('getFollowedChannels', () => {
    it('should return followed channels', async () => {
      const userAccessToken = 'user-token';
      const userId = 'user123';
      const followedData = {
        data: [
          {
            broadcaster_id: 'channel1',
            broadcaster_name: 'Channel1',
            broadcaster_login: 'channel1',
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: followedData,
      });

      const result = await service.getFollowedChannels(userAccessToken, userId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://api.twitch.tv/helix/channels/followed?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
            'Client-Id': 'test-client-id',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(followedData);
    });
  });

  describe('createWebhook', () => {
    it('should create webhook for stream.online event', async () => {
      const dto = {
        broadcasterUserId: 'broadcaster123',
        eventType: 'stream.online',
      };
      const webhookUrl = 'https://example.com/webhook';
      const appToken = 'app-access-token';
      const webhookResponse = {
        data: [
          {
            id: 'subscription123',
            status: 'enabled',
            type: 'stream.online',
          },
        ],
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: appToken },
      });

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: webhookResponse,
      });

      const result = await service.createWebhook(dto, webhookUrl);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        expect.any(URLSearchParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        {
          type: 'stream.online',
          version: '1',
          condition: { broadcaster_user_id: 'broadcaster123' },
          transport: {
            method: 'webhook',
            callback: webhookUrl,
            secret: 'test-webhook-secret',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${appToken}`,
            'Client-Id': 'test-client-id',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual(webhookResponse);
    });

    it('should create webhook for channel.follow event with version 2', async () => {
      const dto = {
        broadcasterUserId: 'broadcaster123',
        eventType: 'channel.follow',
      };
      const webhookUrl = 'https://example.com/webhook';
      const appToken = 'app-access-token';
      const webhookResponse = {
        data: [
          {
            id: 'subscription456',
            status: 'enabled',
            type: 'channel.follow',
          },
        ],
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: appToken },
      });

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: webhookResponse,
      });

      const result = await service.createWebhook(dto, webhookUrl);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        {
          type: 'channel.follow',
          version: '2',
          condition: {
            broadcaster_user_id: 'broadcaster123',
            moderator_user_id: 'broadcaster123',
          },
          transport: {
            method: 'webhook',
            callback: webhookUrl,
            secret: 'test-webhook-secret',
          },
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${appToken}`,
          }),
        })
      );

      expect(result).toEqual(webhookResponse);
    });

    it('should use custom secret when provided', async () => {
      const dto = {
        broadcasterUserId: 'broadcaster123',
        eventType: 'stream.online',
        secret: 'custom-secret',
      };
      const webhookUrl = 'https://example.com/webhook';
      const appToken = 'app-access-token';

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: appToken },
      });

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { data: [] },
      });

      await service.createWebhook(dto, webhookUrl);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        expect.objectContaining({
          transport: expect.objectContaining({
            secret: 'custom-secret',
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const messageId = 'msg123';
      const timestamp = '2023-01-01T00:00:00Z';
      const body = '{"event":"test"}';
      const secret = 'test-webhook-secret';

      const message = messageId + timestamp + body;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(message);
      const validSignature = 'sha256=' + hmac.digest('hex');

      const result = service.verifyWebhookSignature(
        messageId,
        timestamp,
        body,
        validSignature
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const messageId = 'msg123';
      const timestamp = '2023-01-01T00:00:00Z';
      const body = '{"event":"test"}';
      const secret = 'test-webhook-secret';

      const message = messageId + timestamp + body;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(message);
      const validHex = hmac.digest('hex');

      const invalidHex = validHex.split('').reverse().join('');
      const invalidSignature = 'sha256=' + invalidHex;

      const result = service.verifyWebhookSignature(
        messageId,
        timestamp,
        body,
        invalidSignature
      );

      expect(result).toBe(false);
    });
  });

  describe('getServiceMetadata', () => {
    it('should return service metadata', () => {
      const metadata = service.getServiceMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('twitch');
      expect(metadata.actions).toBeInstanceOf(Array);
      expect(metadata.reactions).toBeInstanceOf(Array);
    });

    it('should have 4 actions defined', () => {
      const metadata = service.getServiceMetadata();

      expect(metadata.actions).toHaveLength(4);

      const actionNames = metadata.actions.map((a) => a.name);
      expect(actionNames).toContain('stream.online');
      expect(actionNames).toContain('stream.offline');
      expect(actionNames).toContain('channel.update');
      expect(actionNames).toContain('channel.follow');
    });

    it('should have 2 reactions defined', () => {
      const metadata = service.getServiceMetadata();

      expect(metadata.reactions).toHaveLength(2);

      const reactionNames = metadata.reactions.map((r) => r.name);
      expect(reactionNames).toContain('send_chat_message');
      expect(reactionNames).toContain('update_stream_info');
    });

    it('should have required parameters for each action', () => {
      const metadata = service.getServiceMetadata();

      metadata.actions.forEach((action) => {
        expect(action.parameters).toBeInstanceOf(Array);
        expect(action.parameters.length).toBeGreaterThan(0);

        const broadcasterParam = action.parameters.find(
          (p) => p.name === 'broadcasterUserId'
        );
        expect(broadcasterParam).toBeDefined();
        expect(broadcasterParam?.type).toBe('string');
        expect(broadcasterParam?.required).toBe(true);
      });
    });
  });

  describe('getAppAccessToken', () => {
    it('should fetch app access token', async () => {
      const appToken = 'app-access-token';

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: appToken },
      });

      const dto = {
        broadcasterUserId: 'broadcaster123',
        eventType: 'stream.online',
      };

      await service.createWebhook(dto, 'https://example.com/webhook');

      const tokenCall = mockedAxios.post.mock.calls.find((call) =>
        call[0].includes('oauth2/token')
      );

      expect(tokenCall).toBeDefined();
      expect(tokenCall?.[0]).toBe('https://id.twitch.tv/oauth2/token');

      const params = tokenCall?.[1] as URLSearchParams;
      expect(params.get('client_id')).toBe('test-client-id');
      expect(params.get('client_secret')).toBe('test-client-secret');
      expect(params.get('grant_type')).toBe('client_credentials');
    });
  });

  describe('buildCondition', () => {
    it('should build condition for channel.follow with moderator_user_id', async () => {
      const dto = {
        broadcasterUserId: 'broadcaster123',
        eventType: 'channel.follow',
      };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'token' },
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { data: [] },
      });

      await service.createWebhook(dto, 'https://example.com/webhook');

      const webhookCall = mockedAxios.post.mock.calls.find((call) =>
        call[0].includes('eventsub/subscriptions')
      );

      expect(webhookCall?.[1]).toMatchObject({
        condition: {
          broadcaster_user_id: 'broadcaster123',
          moderator_user_id: 'broadcaster123',
        },
      });
    });

    it('should build condition for other events without moderator_user_id', async () => {
      const dto = {
        broadcasterUserId: 'broadcaster123',
        eventType: 'stream.online',
      };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'token' },
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { data: [] },
      });

      await service.createWebhook(dto, 'https://example.com/webhook');

      const webhookCall = mockedAxios.post.mock.calls.find((call) =>
        call[0].includes('eventsub/subscriptions')
      );

      expect(webhookCall?.[1]).toMatchObject({
        condition: {
          broadcaster_user_id: 'broadcaster123',
        },
      });
      expect((webhookCall?.[1] as any)?.condition).not.toHaveProperty(
        'moderator_user_id'
      );
    });
  });
});

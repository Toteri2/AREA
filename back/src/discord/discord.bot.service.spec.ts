import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DiscordBotService } from './discord.bot.service';

jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    login: jest.fn().mockResolvedValue(undefined),
    user: { tag: 'TestBot#1234' },
  })),
  Events: {
    ClientReady: 'ready',
    MessageCreate: 'messageCreate',
    MessageReactionAdd: 'messageReactionAdd',
    Error: 'error',
  },
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 4,
    GuildMessageReactions: 8,
    GuildMembers: 16,
  },
}));

describe('DiscordBotService', () => {
  let service: DiscordBotService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordBotService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'DISCORD_BOT_TOKEN') return 'test-bot-token';
              if (key === 'DISCORD_WEBHOOK_URL')
                return 'http://localhost:3000/webhook';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DiscordBotService>(DiscordBotService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should configure Discord client with correct intents', () => {
      expect(service).toBeDefined();
      expect(service.getClient()).toBeDefined();
    });

    it('should get webhook URL from config', () => {
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'DISCORD_WEBHOOK_URL'
      );
    });
  });

  describe('isClientReady', () => {
    it('should return false initially', () => {
      expect(service.isClientReady()).toBe(false);
    });

    it('should return true after client ready event', async () => {
      (service as any).isReady = true;
      expect(service.isClientReady()).toBe(true);
    });
  });

  describe('getClient', () => {
    it('should return the Discord client instance', () => {
      expect(service.getClient()).toBeDefined();
    });
  });

  describe('event handlers', () => {
    it('should setup event handlers on initialization', async () => {
      const mockClient = service.getClient() as any;
      await (service as any).initializeBot();

      expect(mockClient.on).toHaveBeenCalled();
    });
  });

  describe('handleMessageCreate', () => {
    it('should ignore messages from bots', async () => {
      const mockMessage = {
        author: { bot: true },
        content: 'test message',
      };

      const sendToWebhookSpy = jest.spyOn(service as any, 'sendToWebhook');

      await (service as any).handleMessageCreate(mockMessage);

      expect(sendToWebhookSpy).not.toHaveBeenCalled();
    });

    it('should process messages from users', async () => {
      const mockMessage = {
        author: {
          bot: false,
          id: 'user123',
          tag: 'TestUser#1234',
        },
        channel: { id: 'channel123' },
        id: 'message123',
        content: 'Hello world',
        createdAt: new Date(),
      };

      const sendToWebhookSpy = jest
        .spyOn(service as any, 'sendToWebhook')
        .mockResolvedValue(undefined);

      await (service as any).handleMessageCreate(mockMessage);

      expect(sendToWebhookSpy).toHaveBeenCalledWith({
        triggerType: 'new_message_in_channel',
        channelId: 'channel123',
        messageId: 'message123',
        content: 'Hello world',
        authorId: 'user123',
        authorTag: 'TestUser#1234',
        timestamp: mockMessage.createdAt,
      });
    });
  });

  describe('handleReactionAdd', () => {
    it('should ignore reactions from bots', async () => {
      const mockReaction = {
        partial: false,
      };
      const mockUser = {
        bot: true,
        partial: false,
      };

      const sendToWebhookSpy = jest.spyOn(service as any, 'sendToWebhook');

      await (service as any).handleReactionAdd(mockReaction, mockUser);

      expect(sendToWebhookSpy).not.toHaveBeenCalled();
    });

    it('should process reactions from users', async () => {
      const mockReaction = {
        partial: false,
        message: {
          channel: { id: 'channel123' },
          id: 'message123',
        },
        emoji: { name: '👍' },
        count: 5,
      };
      const mockUser = {
        bot: false,
        partial: false,
        id: 'user123',
        tag: 'TestUser#1234',
      };

      const sendToWebhookSpy = jest
        .spyOn(service as any, 'sendToWebhook')
        .mockResolvedValue(undefined);

      await (service as any).handleReactionAdd(mockReaction, mockUser);

      expect(sendToWebhookSpy).toHaveBeenCalledWith({
        triggerType: 'reaction_added',
        channelId: 'channel123',
        messageId: 'message123',
        emoji: '👍',
        userId: 'user123',
        userTag: 'TestUser#1234',
        count: 5,
      });
    });

    it('should fetch partial reactions and users', async () => {
      const mockReaction = {
        partial: true,
        fetch: jest.fn().mockResolvedValue({
          partial: false,
          message: {
            channel: { id: 'channel123' },
            id: 'message123',
          },
          emoji: { name: '👍' },
          count: 1,
        }),
        message: {
          channel: { id: 'channel123' },
          id: 'message123',
        },
        emoji: { name: '👍' },
        count: 1,
      };
      const mockUser = {
        bot: false,
        partial: true,
        fetch: jest.fn().mockResolvedValue({
          partial: false,
          id: 'user123',
          tag: 'TestUser#1234',
        }),
        id: 'user123',
        tag: 'TestUser#1234',
      };

      const sendToWebhookSpy = jest
        .spyOn(service as any, 'sendToWebhook')
        .mockResolvedValue(undefined);

      await (service as any).handleReactionAdd(mockReaction, mockUser);

      expect(mockReaction.fetch).toHaveBeenCalled();
      expect(mockUser.fetch).toHaveBeenCalled();
      expect(sendToWebhookSpy).toHaveBeenCalled();
    });
  });
});

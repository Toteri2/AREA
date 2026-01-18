import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { DiscordService } from './discord.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DiscordService', () => {
  let service: DiscordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'DISCORD_BOT_TOKEN') return 'test-bot-token';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DiscordService>(DiscordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getServiceMetadata', () => {
    it('should return service metadata with actions and reactions', () => {
      const metadata = service.getServiceMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('discord');
      expect(metadata.actions).toBeInstanceOf(Array);
      expect(metadata.reactions).toBeInstanceOf(Array);
    });

    it('should have 3 actions defined', () => {
      const metadata = service.getServiceMetadata();
      expect(metadata.actions).toHaveLength(3);

      const actionNames = metadata.actions.map((a) => a.name);
      expect(actionNames).toContain('new_message_in_channel');
      expect(actionNames).toContain('user_joins_guild');
      expect(actionNames).toContain('reaction_added');
    });

    it('should have 3 reactions defined', () => {
      const metadata = service.getServiceMetadata();
      expect(metadata.reactions).toHaveLength(3);

      const reactionNames = metadata.reactions.map((r) => r.name);
      expect(reactionNames).toContain('send_message');
      expect(reactionNames).toContain('add_role_to_user');
      expect(reactionNames).toContain('create_private_channel');
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers with Bearer token', () => {
      const token = 'test_token_123';
      const headers = service.getHeaders(token);

      expect(headers).toEqual({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      });
    });
  });

  describe('handleResponse', () => {
    it('should return parsed JSON for successful response', async () => {
      const mockData = { id: '123', name: 'Test' };
      const mockResponse = {
        status: 200,
        data: mockData,
      };

      const result = await service.handleResponse(mockResponse);
      expect(result).toEqual(mockData);
    });

    it('should return null for 204 No Content response', async () => {
      const mockResponse = {
        status: 204,
        data: null,
      };

      const result = await service.handleResponse(mockResponse);
      expect(result).toBeNull();
    });
  });

  describe('API Methods', () => {
    const mockToken = 'mock_discord_token';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call Discord API for getCurrentUser', async () => {
      const mockUser = { id: '123', username: 'testuser' };
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockUser,
      });

      const result = await service.getCurrentUser(mockToken);

      expect(axios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/users/@me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should call Discord API for listUserGuilds', async () => {
      const mockGuilds = [
        { id: '1', name: 'Guild 1' },
        { id: '2', name: 'Guild 2' },
      ];
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockGuilds,
      });

      const result = await service.listUserGuilds(mockToken);

      expect(axios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/users/@me/guilds',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
      expect(result).toEqual(mockGuilds);
    });

    it('should call Discord API for sendMessage', async () => {
      const dto = {
        channelId: '123',
        content: 'Test message',
        embeds: [],
      };
      const mockMessage = { id: '456', content: 'Test message' };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockMessage,
      });

      const result = await service.sendMessage(mockToken, dto);

      expect(axios.post).toHaveBeenCalledWith(
        `https://discord.com/api/v10/channels/${dto.channelId}/messages`,
        { content: dto.content },
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
      expect(result).toEqual(mockMessage);
    });

    it('should call Discord API for addRoleToUser', async () => {
      const dto = {
        guildId: '123',
        userId: '456',
        roleId: '789',
      };

      mockedAxios.put.mockResolvedValue({
        status: 204,
        data: null,
      });

      const result = await service.addRoleToUser(mockToken, dto);

      expect(axios.put).toHaveBeenCalledWith(
        `https://discord.com/api/v10/guilds/${dto.guildId}/members/${dto.userId}/roles/${dto.roleId}`,
        {},
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
      expect(result).toEqual({
        success: true,
        message: 'Role added successfully',
      });
    });

    it('should call Discord API for createPrivateChannel', async () => {
      const dto = {
        guildId: '123',
        name: 'private-channel',
        type: 0,
        permissionOverwrites: [],
      };
      const mockChannel = { id: '999', name: 'private-channel' };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockChannel,
      });

      const result = await service.createPrivateChannel(mockToken, dto);

      expect(axios.post).toHaveBeenCalledWith(
        `https://discord.com/api/v10/guilds/${dto.guildId}/channels`,
        expect.objectContaining({
          name: dto.name,
        }),
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
      expect(result).toEqual(mockChannel);
    });
  });

  describe('getBotHeaders', () => {
    it('should return bot headers', () => {
      const headers = service.getBotHeaders();

      expect(headers).toEqual({
        Authorization: 'Bot test-bot-token',
        'Content-Type': 'application/json',
      });
    });
  });

  describe('getChannelMessages', () => {
    it('should get channel messages', async () => {
      const mockMessages = [
        { id: '1', content: 'Message 1' },
        { id: '2', content: 'Message 2' },
      ];

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockMessages,
      });

      const result = await service.getChannelMessages('token', '123');

      expect(result).toEqual(mockMessages);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/123/messages?limit=10',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe('getGuildMembers', () => {
    it('should get guild members', async () => {
      const mockMembers = [
        { user: { id: '1', username: 'user1' } },
        { user: { id: '2', username: 'user2' } },
      ];

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockMembers,
      });

      const result = await service.getGuildMembers('token', '123');

      expect(result).toEqual(mockMembers);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/123/members?limit=100',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe('getMessageReactions', () => {
    it('should get message reactions', async () => {
      const mockMessage = {
        id: '123',
        reactions: [{ emoji: { name: '👍' }, count: 5 }],
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockMessage,
      });

      const result = await service.getMessageReactions('token', '123', '456');

      expect(result).toEqual(mockMessage);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/123/messages/456',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe('listGuildChannels', () => {
    it('should list guild channels', async () => {
      const mockChannels = [
        { id: '1', name: 'general', type: 0 },
        { id: '2', name: 'voice', type: 2 },
      ];

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockChannels,
      });

      const result = await service.listGuildChannels('token', '123');

      expect(result).toEqual([{ id: '1', name: 'general', type: 0 }]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/123/channels',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe('listGuildRoles', () => {
    it('should list guild roles', async () => {
      const mockRoles = [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Member' },
      ];

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockRoles,
      });

      const result = await service.listGuildRoles('token', '123');

      expect(result).toEqual(mockRoles);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/123/roles',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe('sendMessage with embeds', () => {
    it('should send message with embeds', async () => {
      const dto = {
        channelId: '123',
        content: 'Test message',
        embeds: [{ title: 'Embed Title', description: 'Embed Description' }],
      };
      const mockMessage = { id: '456', content: 'Test message' };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockMessage,
      });

      const result = await service.sendMessage('token', dto);

      expect(result).toEqual(mockMessage);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/123/messages',
        {
          content: 'Test message',
          embeds: dto.embeds,
        },
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe('createPrivateChannel with permissions', () => {
    it('should create private channel with permission overwrites', async () => {
      const dto = {
        guildId: '123',
        name: 'private-channel',
        type: 0,
        permissionOverwrites: [
          { id: '456', type: 0, allow: '1024', deny: '0' },
        ],
      };
      const mockChannel = { id: '999', name: 'private-channel' };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockChannel,
      });

      const result = await service.createPrivateChannel('token', dto);

      expect(result).toEqual(mockChannel);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/123/channels',
        {
          name: 'private-channel',
          type: 0,
          permission_overwrites: dto.permissionOverwrites,
        },
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe('Webhook methods', () => {
    it('should create webhook', async () => {
      const mockWebhook = {
        id: '123',
        name: 'test-webhook',
        token: 'webhook-token',
      };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockWebhook,
      });

      const result = await service.createWebhook(
        'token',
        '456',
        'test-webhook'
      );

      expect(result).toEqual(mockWebhook);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/456/webhooks',
        { name: 'test-webhook' },
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });

    it('should create webhook with avatar', async () => {
      const mockWebhook = { id: '123', name: 'test-webhook' };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockWebhook,
      });

      const result = await service.createWebhook(
        'token',
        '456',
        'test-webhook',
        'avatar-data'
      );

      expect(result).toEqual(mockWebhook);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/456/webhooks',
        { name: 'test-webhook', avatar: 'avatar-data' },
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });

    it('should get channel webhooks', async () => {
      const mockWebhooks = [
        { id: '1', name: 'webhook1' },
        { id: '2', name: 'webhook2' },
      ];

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockWebhooks,
      });

      const result = await service.getChannelWebhooks('123');

      expect(result).toEqual(mockWebhooks);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/123/webhooks',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });

    it('should get guild webhooks', async () => {
      const mockWebhooks = [{ id: '1', name: 'webhook1' }];

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockWebhooks,
      });

      const result = await service.getGuildWebhooks('123');

      expect(result).toEqual(mockWebhooks);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/123/webhooks',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });

    it('should delete webhook', async () => {
      mockedAxios.delete.mockResolvedValue({
        status: 204,
        data: null,
      });

      const result = await service.deleteWebhook('123');

      expect(result).toEqual({
        success: true,
        message: 'Webhook deleted successfully',
      });
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'https://discord.com/api/v10/webhooks/123',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });

    it('should execute webhook', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 204,
        data: null,
      });

      const result = await service.executeWebhook(
        '123',
        'token',
        'Test message'
      );

      expect(result).toEqual({
        success: true,
        message: 'Message sent via webhook',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/v10/webhooks/123/token',
        { content: 'Test message' },
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should execute webhook with embeds', async () => {
      const embeds = [{ title: 'Title', description: 'Description' }];

      mockedAxios.post.mockResolvedValue({
        status: 204,
        data: null,
      });

      const result = await service.executeWebhook(
        '123',
        'token',
        'Test message',
        embeds
      );

      expect(result).toEqual({
        success: true,
        message: 'Message sent via webhook',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/v10/webhooks/123/token',
        { content: 'Test message', embeds },
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });
});

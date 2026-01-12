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
});

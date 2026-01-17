import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';

describe('DiscordController', () => {
  let controller: DiscordController;
  let discordService: DiscordService;
  let _authService: AuthService;

  const mockDiscordService = {
    listUserGuilds: jest.fn(),
    listGuildChannels: jest.fn(),
    getGuildMembers: jest.fn(),
    listGuildRoles: jest.fn(),
    getChannelMessages: jest.fn(),
    getMessageReactions: jest.fn(),
    sendMessage: jest.fn(),
    addRoleToUser: jest.fn(),
    createPrivateChannel: jest.fn(),
    getCurrentUser: jest.fn(),
    getServiceMetadata: jest.fn(),
  };

  const mockAuthService = {
    getDiscordProvider: jest.fn(),
  };

  const mockReactionsService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscordController],
      providers: [
        {
          provide: DiscordService,
          useValue: mockDiscordService,
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
          provide: getRepositoryToken(Hook),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DiscordController>(DiscordController);
    discordService = module.get<DiscordService>(DiscordService);
    _authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listGuilds', () => {
    it('should return user guilds', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockGuilds = [
        { id: '1', name: 'Guild 1' },
        { id: '2', name: 'Guild 2' },
      ];

      mockDiscordService.listUserGuilds.mockResolvedValue(mockGuilds);

      const result = await controller.listGuilds(mockReq);

      expect(discordService.listUserGuilds).toHaveBeenCalledWith('test_token');
      expect(result).toEqual(mockGuilds);
    });

    it('should throw UnauthorizedException if Discord not linked', async () => {
      const mockReq = { user: { id: 1 }, provider: undefined };

      await expect(controller.listGuilds(mockReq)).rejects.toThrow(TypeError);
    });
  });

  describe('listGuildChannels', () => {
    it('should return guild channels', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockChannels = [
        { id: '1', name: 'Channel 1' },
        { id: '2', name: 'Channel 2' },
      ];

      mockDiscordService.listGuildChannels.mockResolvedValue(mockChannels);

      const result = await controller.listGuildChannels(mockReq, '123');

      expect(discordService.listGuildChannels).toHaveBeenCalledWith(
        'test_token',
        '123'
      );
      expect(result).toEqual(mockChannels);
    });
  });

  describe('sendMessage', () => {
    it('should send a message to Discord channel', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockDto = {
        channelId: '123',
        content: 'Test message',
        embeds: [],
      };
      const mockResponse = { id: '456', content: 'Test message' };

      mockDiscordService.sendMessage.mockResolvedValue(mockResponse);

      const result = await controller.sendMessage(mockReq, mockDto);

      expect(discordService.sendMessage).toHaveBeenCalledWith(
        'test_token',
        mockDto
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException if Discord not linked', async () => {
      const mockReq = { user: { id: 1 }, provider: undefined };
      const mockDto = {
        channelId: '123',
        content: 'Test message',
        embeds: [],
      };

      try {
        await controller.sendMessage(mockReq, mockDto);
        fail('Should have thrown an exception');
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('addRoleToUser', () => {
    it('should add a role to a user', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockDto = {
        guildId: '123',
        userId: '456',
        roleId: '789',
      };
      const mockResponse = { success: true };

      mockDiscordService.addRoleToUser.mockResolvedValue(mockResponse);

      const result = await controller.addRoleToUser(mockReq, mockDto);

      expect(discordService.addRoleToUser).toHaveBeenCalledWith(
        'test_token',
        mockDto
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createPrivateChannel', () => {
    it('should create a private channel', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockDto = {
        guildId: '123',
        name: 'private-channel',
        type: 0,
        permissionOverwrites: [],
      };
      const mockResponse = { id: '999', name: 'private-channel' };

      mockDiscordService.createPrivateChannel.mockResolvedValue(mockResponse);

      const result = await controller.createPrivateChannel(mockReq, mockDto);

      expect(discordService.createPrivateChannel).toHaveBeenCalledWith(
        'test_token',
        mockDto
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listGuildChannels', () => {
    it('should return guild channels', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockChannels = [{ id: '1', name: 'general' }];

      mockDiscordService.listGuildChannels.mockResolvedValue(mockChannels);

      const result = await controller.listGuildChannels(mockReq, '123');

      expect(discordService.listGuildChannels).toHaveBeenCalledWith(
        'test_token',
        '123'
      );
      expect(result).toEqual(mockChannels);
    });

    it('should throw UnauthorizedException if Discord not linked', async () => {
      const mockReq = { user: { id: 1 }, provider: undefined };

      try {
        await controller.listGuildChannels(mockReq, '123');
        fail('Should have thrown an exception');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
      }
    });
  });

  describe('listGuildMembers', () => {
    it('should return guild members', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockMembers = [{ id: '1', username: 'user1' }];

      mockDiscordService.getGuildMembers.mockResolvedValue(mockMembers);

      const result = await controller.listGuildMembers(mockReq, '123');

      expect(discordService.getGuildMembers).toHaveBeenCalledWith(
        'test_token',
        '123'
      );
      expect(result).toEqual(mockMembers);
    });

    it('should throw UnauthorizedException if Discord not linked', async () => {
      const mockReq = { user: { id: 1 }, provider: undefined };

      await expect(controller.listGuildMembers(mockReq, '123')).rejects.toThrow(
        TypeError
      );
    });
  });

  describe('listGuildRoles', () => {
    it('should return guild roles', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockRoles = [{ id: '1', name: 'Admin' }];

      mockDiscordService.listGuildRoles.mockResolvedValue(mockRoles);

      const result = await controller.listGuildRoles(mockReq, '123');

      expect(discordService.listGuildRoles).toHaveBeenCalledWith(
        'test_token',
        '123'
      );
      expect(result).toEqual(mockRoles);
    });

    it('should throw UnauthorizedException if Discord not linked', async () => {
      const mockReq = { user: { id: 1 }, provider: undefined };

      await expect(controller.listGuildRoles(mockReq, '123')).rejects.toThrow(
        TypeError
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current Discord user', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token' },
      };
      const _mockProvider = { accessToken: 'test_token' };
      const mockUser = { id: '999', username: 'testuser' };

      mockDiscordService.getCurrentUser.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockReq);

      expect(discordService.getCurrentUser).toHaveBeenCalledWith('test_token');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if Discord not linked', async () => {
      const mockReq = { user: { id: 1 }, provider: undefined };

      await expect(controller.getCurrentUser(mockReq)).rejects.toThrow(
        TypeError
      );
    });
  });
});

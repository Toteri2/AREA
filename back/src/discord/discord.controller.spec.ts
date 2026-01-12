import { UnauthorizedException } from '@nestjs/common';
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
  let authService: AuthService;

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
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listGuilds', () => {
    it('should return user guilds', async () => {
      const mockReq = { user: { id: 1 } };
      const mockProvider = { accessToken: 'test_token' };
      const mockGuilds = [
        { id: '1', name: 'Guild 1' },
        { id: '2', name: 'Guild 2' },
      ];

      mockAuthService.getDiscordProvider.mockResolvedValue(mockProvider);
      mockDiscordService.listUserGuilds.mockResolvedValue(mockGuilds);

      const result = await controller.listGuilds(mockReq);

      expect(authService.getDiscordProvider).toHaveBeenCalledWith(1);
      expect(discordService.listUserGuilds).toHaveBeenCalledWith('test_token');
      expect(result).toEqual(mockGuilds);
    });

    it('should throw UnauthorizedException if Discord not linked', async () => {
      const mockReq = { user: { id: 1 } };
      mockAuthService.getDiscordProvider.mockResolvedValue(null);

      await expect(controller.listGuilds(mockReq)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('listGuildChannels', () => {
    it('should return guild channels', async () => {
      const mockReq = { user: { id: 1 } };
      const mockProvider = { accessToken: 'test_token' };
      const mockChannels = [
        { id: '1', name: 'Channel 1' },
        { id: '2', name: 'Channel 2' },
      ];

      mockAuthService.getDiscordProvider.mockResolvedValue(mockProvider);
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
      const mockReq = { user: { id: 1 } };
      const mockProvider = { accessToken: 'test_token' };
      const mockDto = {
        channelId: '123',
        content: 'Test message',
        embeds: [],
      };
      const mockResponse = { id: '456', content: 'Test message' };

      mockAuthService.getDiscordProvider.mockResolvedValue(mockProvider);
      mockDiscordService.sendMessage.mockResolvedValue(mockResponse);

      const result = await controller.sendMessage(mockReq, mockDto);

      expect(discordService.sendMessage).toHaveBeenCalledWith(
        'test_token',
        mockDto
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException if Discord not linked', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        channelId: '123',
        content: 'Test message',
        embeds: [],
      };

      mockAuthService.getDiscordProvider.mockResolvedValue(null);

      await expect(controller.sendMessage(mockReq, mockDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('addRoleToUser', () => {
    it('should add a role to a user', async () => {
      const mockReq = { user: { id: 1 } };
      const mockProvider = { accessToken: 'test_token' };
      const mockDto = {
        guildId: '123',
        userId: '456',
        roleId: '789',
      };
      const mockResponse = { success: true };

      mockAuthService.getDiscordProvider.mockResolvedValue(mockProvider);
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
      const mockReq = { user: { id: 1 } };
      const mockProvider = { accessToken: 'test_token' };
      const mockDto = {
        guildId: '123',
        name: 'private-channel',
        type: 0,
        permissionOverwrites: [],
      };
      const mockResponse = { id: '999', name: 'private-channel' };

      mockAuthService.getDiscordProvider.mockResolvedValue(mockProvider);
      mockDiscordService.createPrivateChannel.mockResolvedValue(mockResponse);

      const result = await controller.createPrivateChannel(mockReq, mockDto);

      expect(discordService.createPrivateChannel).toHaveBeenCalledWith(
        'test_token',
        mockDto
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMetadata', () => {
    it('should return service metadata', async () => {
      const mockMetadata = {
        name: 'discord',
        actions: [],
        reactions: [],
      };

      mockDiscordService.getServiceMetadata.mockReturnValue(mockMetadata);

      const result = await controller.getMetadata();

      expect(discordService.getServiceMetadata).toHaveBeenCalled();
      expect(result).toEqual(mockMetadata);
    });
  });
});

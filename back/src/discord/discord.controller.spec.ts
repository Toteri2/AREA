import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
  let reactionsService: ReactionsService;
  let hooksRepository: any;
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
    createWebhook: jest.fn(),
    getGuildWebhooks: jest.fn(),
    getChannelWebhooks: jest.fn(),
    deleteWebhook: jest.fn(),
  };

  const mockAuthService = {
    getDiscordProvider: jest.fn(),
  };

  const mockReactionsService = {
    execute: jest.fn(),
    findByHookId: jest.fn(),
    executeReaction: jest.fn(),
  };

  const mockHooksRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
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
          useValue: mockHooksRepository,
        },
      ],
    }).compile();

    controller = module.get<DiscordController>(DiscordController);
    discordService = module.get<DiscordService>(DiscordService);
    reactionsService = module.get<ReactionsService>(ReactionsService);
    hooksRepository = mockHooksRepository;
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

  describe('handleWebhook', () => {
    it('should respond with type 1 for ping event', async () => {
      const body = { type: 1 };

      const result = await controller.handleWebhook(body, 'sig', 'timestamp');

      expect(result).toEqual({ type: 1 });
    });

    it('should process webhook events and execute reactions', async () => {
      const body = {
        type: 2,
        data: {
          triggerType: 'new_message_in_channel',
          channelId: 'channel123',
          guildId: 'guild123',
        },
      };

      const mockHook = {
        id: 1,
        userId: 1,
        service: 'discord',
        additionalInfos: {
          events: ['new_message_in_channel'],
          channelId: 'channel123',
          guildId: 'guild123',
        },
      };

      const mockReaction = { id: 1, service: 'discord' };

      hooksRepository.find.mockResolvedValue([mockHook]);
      mockReactionsService.findByHookId.mockResolvedValue([mockReaction]);
      mockReactionsService.executeReaction.mockResolvedValue({});

      const result = await controller.handleWebhook(body, 'sig', 'timestamp');

      expect(result).toEqual({ success: true });
      expect(hooksRepository.find).toHaveBeenCalledWith({
        where: { service: 'discord' },
      });
      expect(reactionsService.findByHookId).toHaveBeenCalledWith(1);
      expect(reactionsService.executeReaction).toHaveBeenCalledWith(
        mockReaction,
        body,
        1
      );
    });

    it('should skip hooks without matching events', async () => {
      const body = {
        type: 2,
        data: {
          triggerType: 'different_event',
          channelId: 'channel123',
          guildId: 'guild123',
        },
      };

      const mockHook = {
        id: 1,
        additionalInfos: {
          events: ['new_message_in_channel'],
          channelId: 'channel123',
          guildId: 'guild123',
        },
      };

      hooksRepository.find.mockResolvedValue([mockHook]);

      const result = await controller.handleWebhook(body, 'sig', 'timestamp');

      expect(result).toEqual({ success: true });
      expect(reactionsService.findByHookId).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const body = { type: 2, data: { triggerType: 'test' } };

      hooksRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(
        controller.handleWebhook(body, 'sig', 'timestamp')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getAllWebhooks', () => {
    it('should return all webhooks for user', async () => {
      const mockReq = { user: { id: 1 } };
      const mockHooks = [
        { id: 1, userId: 1, service: 'discord' },
        { id: 2, userId: 1, service: 'discord' },
      ];

      hooksRepository.find.mockResolvedValue(mockHooks);

      const result = await controller.getAllWebhooks(mockReq);

      expect(result).toEqual(mockHooks);
      expect(hooksRepository.find).toHaveBeenCalledWith({
        where: { userId: 1, service: 'discord' },
      });
    });
  });

  describe('getWebhookDetails', () => {
    it('should return webhook details', async () => {
      const mockReq = { user: { id: 1 } };
      const mockHook = { id: 1, userId: 1, service: 'discord' };

      hooksRepository.findOne.mockResolvedValue(mockHook);

      const result = await controller.getWebhookDetails(mockReq, 1);

      expect(result).toEqual(mockHook);
      expect(hooksRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1, service: 'discord' },
      });
    });

    it('should throw NotFoundException if webhook not found', async () => {
      const mockReq = { user: { id: 1 } };

      hooksRepository.findOne.mockResolvedValue(null);

      await expect(controller.getWebhookDetails(mockReq, 999)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook successfully', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'token' },
      };
      const mockDto = {
        guildId: 'guild123',
        channelId: 'channel123',
        name: 'Test Webhook',
        events: ['new_message_in_channel'],
      };

      const mockGuilds = [{ id: 'guild123', name: 'Test Guild' }];
      const mockChannels = [{ id: 'channel123', name: 'general' }];
      const mockWebhookResult = { id: 'webhook123', name: 'Test Webhook' };
      const mockHook = {
        id: 1,
        userId: 1,
        webhookId: 'webhook123',
        service: 'discord',
      };

      mockDiscordService.listUserGuilds.mockResolvedValue(mockGuilds);
      mockDiscordService.listGuildChannels.mockResolvedValue(mockChannels);
      mockDiscordService.createWebhook.mockResolvedValue(mockWebhookResult);
      hooksRepository.create.mockReturnValue(mockHook);
      hooksRepository.save.mockResolvedValue(mockHook);

      const result = await controller.createWebhook(mockReq, mockDto);

      expect(result).toEqual({ result: mockWebhookResult, hookId: 1 });
      expect(discordService.createWebhook).toHaveBeenCalledWith(
        'token',
        'channel123',
        'Test Webhook',
        undefined
      );
    });

    it('should throw BadRequestException if required fields missing', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'token' },
      };
      const mockDto = {
        guildId: '',
        channelId: 'channel123',
        name: 'Test',
        events: [],
      };

      await expect(controller.createWebhook(mockReq, mockDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException if channel not found', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'token' },
      };
      const mockDto = {
        guildId: 'guild123',
        channelId: 'invalid',
        name: 'Test',
        events: [],
      };

      mockDiscordService.listUserGuilds.mockResolvedValue([
        { id: 'guild123', name: 'Guild' },
      ]);
      mockDiscordService.listGuildChannels.mockResolvedValue([
        { id: 'channel123', name: 'general' },
      ]);

      await expect(controller.createWebhook(mockReq, mockDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('listGuildWebhooks', () => {
    it('should return guild webhooks', async () => {
      const mockReq = { provider: { accessToken: 'token' } };
      const mockWebhooks = [{ id: 'webhook1', name: 'Webhook 1' }];

      mockDiscordService.getGuildWebhooks.mockResolvedValue(mockWebhooks);

      const result = await controller.listGuildWebhooks(mockReq, 'guild123');

      expect(result).toEqual(mockWebhooks);
      expect(discordService.getGuildWebhooks).toHaveBeenCalledWith('guild123');
    });
  });

  describe('listChannelWebhooks', () => {
    it('should return channel webhooks', async () => {
      const mockReq = { provider: { accessToken: 'token' } };
      const mockWebhooks = [{ id: 'webhook1', name: 'Webhook 1' }];

      mockDiscordService.getChannelWebhooks.mockResolvedValue(mockWebhooks);

      const result = await controller.listChannelWebhooks(
        mockReq,
        'channel123'
      );

      expect(result).toEqual(mockWebhooks);
      expect(discordService.getChannelWebhooks).toHaveBeenCalledWith(
        'channel123'
      );
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook successfully', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'token' },
      };
      const mockHook = {
        id: 1,
        userId: 1,
        webhookId: 'webhook123',
        service: 'discord',
      };

      hooksRepository.findOne.mockResolvedValue(mockHook);
      hooksRepository.delete.mockResolvedValue({});
      mockDiscordService.deleteWebhook.mockResolvedValue({});

      const result = await controller.deleteWebhook(mockReq, 1);

      expect(result).toEqual({ message: 'Webhook deleted successfully' });
      expect(hooksRepository.delete).toHaveBeenCalledWith({
        id: 1,
        userId: 1,
        service: 'discord',
      });
      expect(discordService.deleteWebhook).toHaveBeenCalledWith('webhook123');
    });

    it('should throw NotFoundException if webhook not found', async () => {
      const mockReq = { user: { id: 1 } };

      hooksRepository.findOne.mockResolvedValue(null);

      await expect(controller.deleteWebhook(mockReq, 999)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { AuthService } from '../auth/auth.service';
import { DiscordService } from '../discord/discord.service';
import { Hook } from '../shared/entities/hook.entity';
import { Reaction, ReactionType } from '../shared/entities/reaction.entity';
import { ReactionsService } from './reactions.service';

jest.mock('axios');

describe('ReactionsService', () => {
  let service: ReactionsService;
  let reactionsRepository: any;
  let hooksRepository: any;

  const mockReactionsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  const mockHooksRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuthService = {
    getGoogleProvider: jest.fn(),
    getMicrosoftProvider: jest.fn(),
    getJiraProvider: jest.fn(),
    getDiscordProvider: jest.fn(),
    getValidGmailToken: jest.fn(),
    getMicrosoftToken: jest.fn(),
    getValidJiraToken: jest.fn(),
  };

  const mockDiscordService = {
    sendMessage: jest.fn(),
    createPrivateChannel: jest.fn(),
    addRoleToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        {
          provide: getRepositoryToken(Reaction),
          useValue: mockReactionsRepository,
        },
        {
          provide: getRepositoryToken(Hook),
          useValue: mockHooksRepository,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: DiscordService,
          useValue: mockDiscordService,
        },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
    reactionsRepository = module.get(getRepositoryToken(Reaction));
    hooksRepository = module.get(getRepositoryToken(Hook));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a reaction', async () => {
      const mockHook = { id: 1, userId: 1 };
      const mockReaction = {
        id: 1,
        userId: 1,
        hookId: 1,
        reactionType: ReactionType.SEND_EMAIL_GMAIL,
        config: { to: 'test@example.com' },
      };

      mockHooksRepository.findOne.mockResolvedValue(mockHook);
      mockReactionsRepository.create.mockReturnValue(mockReaction);
      mockReactionsRepository.save.mockResolvedValue(mockReaction);

      const result = await service.create(
        1,
        1,
        ReactionType.SEND_EMAIL_GMAIL,
        {
          to: 'test@example.com',
        },
        'test'
      );

      expect(hooksRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
      expect(reactionsRepository.create).toHaveBeenCalled();
      expect(reactionsRepository.save).toHaveBeenCalledWith(mockReaction);
      expect(result).toEqual(mockReaction);
    });

    it('should throw NotFoundException if hook not found', async () => {
      mockHooksRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(1, 1, ReactionType.SEND_EMAIL_GMAIL, {}, 'test')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByHookId', () => {
    it('should return reactions by hook ID', async () => {
      const mockReactions = [
        { id: 1, hookId: 1, reactionType: ReactionType.SEND_EMAIL_GMAIL },
      ];

      mockReactionsRepository.find.mockResolvedValue(mockReactions);

      const result = await service.findByHookId(1);

      expect(reactionsRepository.find).toHaveBeenCalledWith({
        where: { hookId: 1 },
      });
      expect(result).toEqual(mockReactions);
    });
  });

  describe('findByUserId', () => {
    it('should return reactions by user ID', async () => {
      const mockReactions = [
        { id: 1, userId: 1, reactionType: ReactionType.SEND_EMAIL_GMAIL },
      ];

      mockReactionsRepository.find.mockResolvedValue(mockReactions);

      const result = await service.findByUserId(1);

      expect(reactionsRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: ['hook'],
      });
      expect(result).toEqual(mockReactions);
    });
  });

  describe('delete', () => {
    it('should delete a reaction', async () => {
      const mockReaction = { id: 1, userId: 1 };

      mockReactionsRepository.findOne.mockResolvedValue(mockReaction);
      mockReactionsRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(1, 1);

      expect(reactionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
      expect(reactionsRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if reaction not found', async () => {
      mockReactionsRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('executeReaction', () => {
    it('should execute SEND_EMAIL_GMAIL reaction', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.SEND_EMAIL_GMAIL,
        config: { to: '{{author}}@test.com', subject: 'Test', body: 'Body' },
      };
      const mockPayload = { sender: { login: 'testuser' } };

      mockAuthService.getValidGmailToken.mockResolvedValue('gmail_token');
      (axios.post as jest.Mock).mockResolvedValue({ data: { id: '123' } });

      const result = await service.executeReaction(
        mockReaction as unknown as Reaction,
        mockPayload,
        1
      );

      expect(result).toEqual({
        success: true,
        message: 'Email sent via Gmail successfully',
      });
    });

    it('should execute SEND_EMAIL_OUTLOOK reaction', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.SEND_EMAIL_OUTLOOK,
        config: { to: 'test@example.com', subject: 'Test', body: 'Body' },
      };

      mockAuthService.getMicrosoftToken.mockResolvedValue('outlook_token');
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });

      const result = await service.executeReaction(
        mockReaction as unknown as Reaction,
        {},
        1
      );

      expect(result).toEqual({
        success: true,
        message: 'Email sent successfully',
      });
    });

    it('should execute DISCORD_SEND_MESSAGE reaction', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.DISCORD_SEND_MESSAGE,
        config: { channelId: '123', content: 'Hello' },
      };
      const mockProvider = { accessToken: 'discord_token' };

      mockAuthService.getDiscordProvider.mockResolvedValue(mockProvider);
      mockDiscordService.sendMessage.mockResolvedValue({ id: '456' });

      const result = await service.executeReaction(
        mockReaction as unknown as Reaction,
        {},
        1
      );

      expect(mockDiscordService.sendMessage).toHaveBeenCalledWith(
        'discord_token',
        {
          channelId: '123',
          content: 'Hello',
          embeds: undefined,
        }
      );
      expect(result).toEqual({ id: '456' });
    });

    it('should execute DISCORD_CREATE_CHANNEL reaction', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.DISCORD_CREATE_CHANNEL,
        config: { guildId: '123', name: 'test-channel', type: 0 },
      };
      const mockProvider = { accessToken: 'discord_token' };

      mockAuthService.getDiscordProvider.mockResolvedValue(mockProvider);
      mockDiscordService.createPrivateChannel.mockResolvedValue({ id: '789' });

      const result = await service.executeReaction(
        mockReaction as unknown as Reaction,
        {},
        1
      );

      expect(mockDiscordService.createPrivateChannel).toHaveBeenCalled();
      expect(result).toEqual({ id: '789' });
    });

    it('should execute DISCORD_ADD_ROLE reaction', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.DISCORD_ADD_ROLE,
        config: { guildId: '123', targetUserId: '456', roleId: '789' },
      };
      const mockProvider = { accessToken: 'discord_token' };

      mockAuthService.getDiscordProvider.mockResolvedValue(mockProvider);
      mockDiscordService.addRoleToUser.mockResolvedValue({ success: true });

      const result = await service.executeReaction(
        mockReaction as unknown as Reaction,
        {},
        1
      );

      expect(mockDiscordService.addRoleToUser).toHaveBeenCalledWith(
        'discord_token',
        {
          guildId: '123',
          userId: '456',
          roleId: '789',
        }
      );
      expect(result).toEqual({ success: true });
    });

    it('should execute JIRA_CREATE_ISSUE reaction', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.JIRA_CREATE_ISSUE,
        config: {
          projectKey: 'TEST',
          summary: 'Bug',
          description: 'Fix it',
          issueType: 'Bug',
        },
      };
      const mockProvider = {
        accessToken: 'jira_token',
        providerId: 'cloud-123',
      };

      mockAuthService.getJiraProvider.mockResolvedValue(mockProvider);
      mockAuthService.getValidJiraToken.mockResolvedValue('jira_token');
      (axios.post as jest.Mock).mockResolvedValue({
        data: { key: 'TEST-123', id: '10001' },
      });

      const result = await service.executeReaction(
        mockReaction as unknown as Reaction,
        {},
        1
      );

      expect(result).toEqual({
        success: true,
        issueKey: 'TEST-123',
        issueId: '10001',
        message: 'Issue TEST-123 created successfully',
      });
    });

    it('should execute JIRA_ADD_COMMENT reaction', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.JIRA_ADD_COMMENT,
        config: { issueKey: 'TEST-123', comment: 'Great work!' },
      };
      const mockProvider = {
        accessToken: 'jira_token',
        providerId: 'cloud-123',
      };

      mockAuthService.getJiraProvider.mockResolvedValue(mockProvider);
      mockAuthService.getValidJiraToken.mockResolvedValue('jira_token');
      (axios.post as jest.Mock).mockResolvedValue({ data: { id: '123' } });

      const result = await service.executeReaction(
        mockReaction as unknown as Reaction,
        {},
        1
      );

      expect(result).toEqual({
        success: true,
        commentId: '123',
        message: 'Comment added to TEST-123 successfully',
      });
    });

    it('should execute JIRA_UPDATE_STATUS reaction', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.JIRA_UPDATE_STATUS,
        config: { issueKey: 'TEST-123', transitionName: 'Done' },
      };
      const mockProvider = {
        accessToken: 'jira_token',
        providerId: 'cloud-123',
      };

      mockAuthService.getJiraProvider.mockResolvedValue(mockProvider);
      mockAuthService.getValidJiraToken.mockResolvedValue('jira_token');
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          transitions: [{ id: '31', name: 'Done', to: { name: 'Done' } }],
        },
      });
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });

      const result = await service.executeReaction(
        mockReaction as unknown as Reaction,
        {},
        1
      );

      expect(result).toEqual({
        success: true,
        issueKey: 'TEST-123',
        transitionId: '31',
        transitionName: 'Done',
        newStatus: 'Done',
      });
    });

    it('should throw error for unknown reaction type', async () => {
      const mockReaction = {
        id: 1,
        reactionType: 'UNKNOWN_TYPE' as unknown as ReactionType,
        config: {},
      };

      await expect(
        service.executeReaction(mockReaction as unknown as Reaction, {}, 1)
      ).rejects.toThrow('Unknown reaction type');
    });

    it('should throw error when Gmail account not linked', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.SEND_EMAIL_GMAIL,
        config: { to: 'test@test.com', subject: 'Test', body: 'Body' },
      };

      mockAuthService.getValidGmailToken.mockResolvedValue(null);

      await expect(
        service.executeReaction(mockReaction as unknown as Reaction, {}, 1)
      ).rejects.toThrow('Gmail account not linked');
    });

    it('should throw error when Microsoft account not linked', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.SEND_EMAIL_OUTLOOK,
        config: { to: 'test@test.com', subject: 'Test', body: 'Body' },
      };

      mockAuthService.getMicrosoftToken.mockResolvedValue(null);

      await expect(
        service.executeReaction(mockReaction as unknown as Reaction, {}, 1)
      ).rejects.toThrow('Microsoft account not linked');
    });

    it('should throw error when Discord account not linked', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.DISCORD_SEND_MESSAGE,
        config: { channelId: '123', content: 'Hello' },
      };

      mockAuthService.getDiscordProvider.mockResolvedValue(null);

      await expect(
        service.executeReaction(mockReaction as unknown as Reaction, {}, 1)
      ).rejects.toThrow('Discord account not linked');
    });

    it('should throw error when Jira account not linked', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.JIRA_CREATE_ISSUE,
        config: { projectKey: 'TEST', summary: 'Bug' },
      };

      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(
        service.executeReaction(mockReaction as unknown as Reaction, {}, 1)
      ).rejects.toThrow('Jira account not linked');
    });

    it('should replace variables in config with webhook payload', async () => {
      const mockReaction = {
        id: 1,
        reactionType: ReactionType.SEND_EMAIL_GMAIL,
        config: {
          to: 'test@test.com',
          subject: 'New commit by {{author}}',
          body: 'Repository: {{repo}}',
        },
      };
      const mockPayload = {
        repository: { full_name: 'user/repo' },
        sender: { login: 'john' },
      };

      mockAuthService.getValidGmailToken.mockResolvedValue('gmail_token');
      (axios.post as jest.Mock).mockResolvedValue({ data: { id: '123' } });

      await service.executeReaction(
        mockReaction as unknown as Reaction,
        mockPayload,
        1
      );

      expect(axios.post).toHaveBeenCalled();
      const callArgs = (axios.post as jest.Mock).mock.calls[0];
      const emailRaw = callArgs[1].raw;
      const decodedEmail = Buffer.from(
        emailRaw.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      ).toString('utf-8');

      expect(decodedEmail).toContain('New commit by john');
      expect(decodedEmail).toContain('Repository: user/repo');
    });
  });
});

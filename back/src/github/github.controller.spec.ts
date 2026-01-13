import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateWebhookDto } from 'src/github/dto/create_git_webhook.dto';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

describe('GithubController', () => {
  let controller: GithubController;
  let _githubService: GithubService;
  let _authService: AuthService;
  let _reactionsService: ReactionsService;
  let _hooksRepository: any;

  const mockGithubService = {
    createWebhook: jest.fn(),
    listUserRepositories: jest.fn(),
    getServiceMetadata: jest.fn(),
  };

  const mockAuthService = {
    getGithubProvider: jest.fn(),
  };

  const mockReactionsService = {
    findByHookId: jest.fn(),
    executeReaction: jest.fn(),
  };

  const mockHooksRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [
        {
          provide: GithubService,
          useValue: mockGithubService,
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
          provide: ReactionsService,
          useValue: mockReactionsService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                GITHUB_CLIENT_ID: 'test-github-id',
                GITHUB_CLIENT_SECRET: 'test-github-secret',
                GITHUB_WEBHOOK_URL: 'https://test.com/webhook',
              };
              return config[key];
            }),
            getOrThrow: jest.fn((key: string) => {
              const config = {
                GITHUB_CLIENT_ID: 'test-github-id',
                GITHUB_CLIENT_SECRET: 'test-github-secret',
                GITHUB_WEBHOOK_URL: 'https://test.com/webhook',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<GithubController>(GithubController);
    _githubService = module.get<GithubService>(GithubService);
    _authService = module.get<AuthService>(AuthService);
    _reactionsService = module.get<ReactionsService>(ReactionsService);
    _hooksRepository = module.get(getRepositoryToken(Hook));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('webhook', () => {
    it('should handle webhook event and execute reactions', async () => {
      const mockBody = {
        repository: { full_name: 'user/repo' },
        action: 'opened',
      };
      const hooks = [{ id: 1, userId: 1, webhookId: 'hook-123' }];
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

      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockResolvedValue(reactions);
      mockReactionsService.executeReaction.mockResolvedValue(undefined);

      const result = await controller.webhook(
        mockBody,
        'delivery-123',
        'hook-123'
      );

      expect(mockHooksRepository.find).toHaveBeenCalledWith({
        where: { webhookId: 'hook-123', service: 'github' },
      });
      expect(mockReactionsService.findByHookId).toHaveBeenCalledWith(1);
      expect(mockReactionsService.executeReaction).toHaveBeenCalledWith(
        reactions[0],
        mockBody,
        1
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle webhook event without repository', async () => {
      const mockBody = { action: 'ping' };

      const result = await controller.webhook(
        mockBody,
        'delivery-123',
        'hook-123'
      );

      expect(mockHooksRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle reaction execution errors gracefully', async () => {
      const mockBody = {
        repository: { full_name: 'user/repo' },
      };
      const hooks = [{ id: 1, userId: 1, webhookId: 'hook-123' }];
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

      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockResolvedValue(reactions);
      mockReactionsService.executeReaction.mockRejectedValue(
        new Error('Execution failed')
      );

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await controller.webhook(
        mockBody,
        'delivery-123',
        'hook-123'
      );

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toEqual({ success: true });

      consoleSpy.mockRestore();
    });
  });

  describe('createWebhook', () => {
    it('should create GitHub webhook successfully', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto: CreateWebhookDto = {
        owner: 'user',
        repo: 'repo',
        events: ['push'],
      };
      const mockProvider = { accessToken: 'github-token' };
      const mockWebhookResult = {
        id: 'webhook-123',
        url: 'https://api.github.com/repos/user/repo/hooks/123',
      };
      const mockHook = {
        id: 1,
        userId: 1,
        webhookId: 'webhook-123',
        service: 'github',
      };

      mockAuthService.getGithubProvider.mockResolvedValue(mockProvider);
      mockGithubService.createWebhook.mockResolvedValue(mockWebhookResult);
      mockHooksRepository.create.mockReturnValue(mockHook);
      mockHooksRepository.save.mockResolvedValue(mockHook);

      const result = await controller.createWebhook(mockReq, mockDto);

      expect(mockAuthService.getGithubProvider).toHaveBeenCalledWith(1);
      expect(mockGithubService.createWebhook).toHaveBeenCalledWith(
        'github-token',
        mockDto,
        expect.any(String)
      );
      expect(mockHooksRepository.create).toHaveBeenCalledWith({
        userId: 1,
        webhookId: 'webhook-123',
        service: 'github',
      });
      expect(result).toEqual({ result: mockWebhookResult, hookId: 1 });
    });

    it('should throw UnauthorizedException if GitHub not linked', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto: CreateWebhookDto = {
        owner: 'user',
        repo: 'repo',
        events: ['push'],
      };

      mockAuthService.getGithubProvider.mockResolvedValue(null);

      await expect(controller.createWebhook(mockReq, mockDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('listRepositories', () => {
    it('should return user repositories', async () => {
      const mockReq = { user: { id: 1 } };
      const mockProvider = { accessToken: 'github-token' };
      const mockRepos = [
        { id: 1, name: 'repo1', full_name: 'user/repo1' },
        { id: 2, name: 'repo2', full_name: 'user/repo2' },
      ];

      mockAuthService.getGithubProvider.mockResolvedValue(mockProvider);
      mockGithubService.listUserRepositories.mockResolvedValue(mockRepos);

      const result = await controller.listRepositories(mockReq);

      expect(mockAuthService.getGithubProvider).toHaveBeenCalledWith(1);
      expect(mockGithubService.listUserRepositories).toHaveBeenCalledWith(
        'github-token'
      );
      expect(result).toEqual(mockRepos);
    });

    it('should throw UnauthorizedException if GitHub not linked', async () => {
      const mockReq = { user: { id: 1 } };

      mockAuthService.getGithubProvider.mockResolvedValue(null);

      await expect(controller.listRepositories(mockReq)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});

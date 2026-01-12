import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { JiraController } from './jira.controller';
import { JiraService } from './jira.service';

describe('JiraController', () => {
  let controller: JiraController;
  let jiraService: JiraService;
  let authService: AuthService;
  let reactionsService: ReactionsService;
  let hooksRepository: any;

  const mockJiraService = {
    listUserWebhooks: jest.fn(),
    createWebhook: jest.fn(),
    deleteWebhook: jest.fn(),
    getCloudId: jest.fn(),
    listProjects: jest.fn(),
    getIssue: jest.fn(),
    listProjectIssues: jest.fn(),
  };

  const mockAuthService = {
    getJiraProvider: jest.fn(),
    getValidJiraToken: jest.fn(),
  };

  const mockReactionsService = {
    findByHookId: jest.fn(),
    executeReaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JIRA_CLIENT_ID: 'test-jira-id',
        JIRA_CLIENT_SECRET: 'test-jira-secret',
        JIRA_WEBHOOK_URL: 'https://test.com/webhook',
      };
      return config[key];
    }),
    getOrThrow: jest.fn((key: string) => {
      const config = {
        JIRA_CLIENT_ID: 'test-jira-id',
        JIRA_CLIENT_SECRET: 'test-jira-secret',
        JIRA_WEBHOOK_URL: 'https://test.com/webhook',
      };
      return config[key];
    }),
  };

  const mockHooksRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JiraController],
      providers: [
        {
          provide: JiraService,
          useValue: mockJiraService,
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

    controller = module.get<JiraController>(JiraController);
    jiraService = module.get<JiraService>(JiraService);
    authService = module.get<AuthService>(AuthService);
    reactionsService = module.get<ReactionsService>(ReactionsService);
    hooksRepository = module.get(getRepositoryToken(Hook));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleWebhook', () => {
    it('should process webhook event successfully', async () => {
      const webhookData = {
        webhookEvent: 'jira:issue_created',
        issue: { id: '123', key: 'TEST-1' },
      };
      const hooks = [{ id: 1, userId: 1, service: 'jira' }];
      const reactions = [{ id: 1, action: 'test' }];

      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockResolvedValue(reactions);
      mockReactionsService.executeReaction.mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await controller.handleWebhook(webhookData as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Jira webhook received:',
        'jira:issue_created'
      );
      expect(hooksRepository.find).toHaveBeenCalledWith({
        where: { service: 'jira' },
      });
      expect(reactionsService.findByHookId).toHaveBeenCalledWith(1);
      expect(reactionsService.executeReaction).toHaveBeenCalledWith(
        reactions[0],
        webhookData,
        1
      );
      expect(result).toEqual({ success: true });
      consoleSpy.mockRestore();
    });

    it('should handle reaction execution error', async () => {
      const webhookData = {
        webhookEvent: 'jira:issue_created',
        issue: { id: '123', key: 'TEST-1' },
      };
      const hooks = [{ id: 1, userId: 1, service: 'jira' }];
      const reactions = [{ id: 1, action: 'test' }];

      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockResolvedValue(reactions);
      mockReactionsService.executeReaction.mockRejectedValue(
        new Error('Reaction failed')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await controller.handleWebhook(webhookData as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to execute reaction 1:',
        expect.any(Error)
      );
      expect(result).toEqual({ success: true });
      consoleSpy.mockRestore();
    });

    it('should handle hook processing error', async () => {
      const webhookData = {
        webhookEvent: 'jira:issue_created',
        issue: { id: '123', key: 'TEST-1' },
      };
      const hooks = [{ id: 1, userId: 1, service: 'jira' }];

      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockRejectedValue(
        new Error('Hook error')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await controller.handleWebhook(webhookData as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing hook 1:',
        expect.any(Error)
      );
      expect(result).toEqual({ success: true });
      consoleSpy.mockRestore();
    });

    it('should handle webhook error', async () => {
      const webhookData = {
        webhookEvent: 'jira:issue_created',
        issue: { id: '123', key: 'TEST-1' },
      };

      mockHooksRepository.find.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        controller.handleWebhook(webhookData as any)
      ).rejects.toThrow('Database error');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handling Jira webhook:',
        'Database error'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('listWebhooks', () => {
    it('should return user webhooks', async () => {
      const mockReq = { user: { id: 1 } };
      const mockWebhooks = [
        { id: 1, service: 'jira', eventType: 'issue_created' },
        { id: 2, service: 'jira', eventType: 'issue_updated' },
      ];

      mockAuthService.getJiraProvider.mockResolvedValue({
        accessToken: 'test',
      });
      mockJiraService.listUserWebhooks.mockResolvedValue(mockWebhooks);

      const result = await controller.listWebhooks(mockReq);

      expect(jiraService.listUserWebhooks).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWebhooks);
    });

    it('should throw UnauthorizedException if Jira not linked', async () => {
      const mockReq = { user: { id: 1 } };

      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(controller.listWebhooks(mockReq)).rejects.toThrow();
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        projectKey: 'TEST',
        events: ['jira:issue_created'],
      };
      const mockProvider = {
        accessToken: 'test_token',
        providerId: 'cloud-123',
      };
      const mockWebhook = { id: 1, webhookId: '123' };

      mockAuthService.getJiraProvider.mockResolvedValue(mockProvider);
      mockAuthService.getValidJiraToken.mockResolvedValue('test_token');
      mockJiraService.createWebhook.mockResolvedValue(mockWebhook);

      const result = await controller.createWebhook(mockReq, mockDto);

      expect(authService.getJiraProvider).toHaveBeenCalledWith(1);
      expect(authService.getValidJiraToken).toHaveBeenCalledWith(1);
      expect(jiraService.createWebhook).toHaveBeenCalled();
      expect(result).toEqual(mockWebhook);
    });

    it('should throw UnauthorizedException if Jira not linked', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        projectKey: 'TEST',
        events: ['jira:issue_created'],
      };

      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(
        controller.createWebhook(mockReq, mockDto)
      ).rejects.toThrow();
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook', async () => {
      const mockReq = { user: { id: 1 } };
      const webhookId = '1';
      const mockProvider = { accessToken: 'test_token' };

      mockAuthService.getJiraProvider.mockResolvedValue({
        ...mockProvider,
        providerId: 'cloud-123',
      });
      mockAuthService.getValidJiraToken.mockResolvedValue('test_token');
      mockJiraService.deleteWebhook.mockResolvedValue({ success: true });

      const result = await controller.deleteWebhook(mockReq, webhookId);

      expect(authService.getJiraProvider).toHaveBeenCalledWith(1);
      expect(authService.getValidJiraToken).toHaveBeenCalledWith(1);
      expect(jiraService.deleteWebhook).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Webhook deleted successfully' });
    });

    it('should throw UnauthorizedException if provider not found', async () => {
      const mockReq = { user: { id: 1 } };
      const webhookId = '1';

      mockAuthService.getValidJiraToken.mockResolvedValue('test_token');
      mockAuthService.getJiraProvider.mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        controller.deleteWebhook(mockReq, webhookId)
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting webhook:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should handle deletion error', async () => {
      const mockReq = { user: { id: 1 } };
      const webhookId = '1';

      mockAuthService.getValidJiraToken.mockResolvedValue('test_token');
      mockAuthService.getJiraProvider.mockResolvedValue({
        providerId: 'cloud-123',
      });
      mockJiraService.deleteWebhook.mockRejectedValue(
        new Error('Deletion failed')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        controller.deleteWebhook(mockReq, webhookId)
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting webhook:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('listProjects', () => {
    it('should list user projects', async () => {
      const mockReq = { user: { id: 1 } };
      const mockProjects = [{ id: '1', key: 'TEST', name: 'Test Project' }];

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.listProjects.mockResolvedValue(mockProjects);

      const result = await controller.listProjects(mockReq);

      expect(authService.getJiraProvider).toHaveBeenCalledWith(1);
      expect(jiraService.listProjects).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProjects);
    });

    it('should throw UnauthorizedException if Jira not linked', async () => {
      const mockReq = { user: { id: 1 } };

      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(controller.listProjects(mockReq)).rejects.toThrow();
    });

    it('should handle error fetching projects', async () => {
      const mockReq = { user: { id: 1 } };

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.listProjects.mockRejectedValue(new Error('API error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(controller.listProjects(mockReq)).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching Jira projects:',
        'API error'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getIssue', () => {
    it('should get issue details', async () => {
      const mockReq = { user: { id: 1 } };
      const issueKey = 'TEST-1';
      const mockIssue = { id: '123', key: issueKey, summary: 'Test Issue' };

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.getIssue.mockResolvedValue(mockIssue);

      const result = await controller.getIssue(mockReq, issueKey);

      expect(authService.getJiraProvider).toHaveBeenCalledWith(1);
      expect(jiraService.getIssue).toHaveBeenCalledWith(1, issueKey);
      expect(result).toEqual(mockIssue);
    });

    it('should throw UnauthorizedException if Jira not linked', async () => {
      const mockReq = { user: { id: 1 } };
      const issueKey = 'TEST-1';

      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(controller.getIssue(mockReq, issueKey)).rejects.toThrow();
    });

    it('should handle error fetching issue', async () => {
      const mockReq = { user: { id: 1 } };
      const issueKey = 'TEST-1';

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.getIssue.mockRejectedValue(new Error('Issue not found'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(controller.getIssue(mockReq, issueKey)).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching Jira issue:',
        'Issue not found'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('listProjectIssues', () => {
    it('should list project issues', async () => {
      const mockReq = { user: { id: 1 } };
      const projectKey = 'TEST';
      const mockIssues = [{ id: '123', key: 'TEST-1', summary: 'Issue 1' }];

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.listProjectIssues.mockResolvedValue(mockIssues);

      const result = await controller.listProjectIssues(mockReq, projectKey);

      expect(authService.getJiraProvider).toHaveBeenCalledWith(1);
      expect(jiraService.listProjectIssues).toHaveBeenCalledWith(1, projectKey);
      expect(result).toEqual(mockIssues);
    });

    it('should throw UnauthorizedException if Jira not linked', async () => {
      const mockReq = { user: { id: 1 } };
      const projectKey = 'TEST';

      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(
        controller.listProjectIssues(mockReq, projectKey)
      ).rejects.toThrow();
    });

    it('should handle error fetching project issues', async () => {
      const mockReq = { user: { id: 1 } };
      const projectKey = 'TEST';

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.listProjectIssues.mockRejectedValue(
        new Error('Project not found')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        controller.listProjectIssues(mockReq, projectKey)
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching Jira project issues:',
        'Project not found'
      );
      consoleSpy.mockRestore();
    });
  });
});

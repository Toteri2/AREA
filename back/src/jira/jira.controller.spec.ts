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
  let _authService: AuthService;
  let _reactionsService: ReactionsService;
  let _hooksRepository: any;

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
        JIRA_WEBHOOK_SECRET: 'test-jira-webhook-secret',
      };
      return config[key];
    }),
    getOrThrow: jest.fn((key: string) => {
      const config = {
        JIRA_CLIENT_ID: 'test-jira-id',
        JIRA_CLIENT_SECRET: 'test-jira-secret',
        JIRA_WEBHOOK_URL: 'https://test.com/webhook',
        JIRA_WEBHOOK_SECRET: 'test-jira-webhook-secret',
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
    _authService = module.get<AuthService>(AuthService);
    _reactionsService = module.get<ReactionsService>(ReactionsService);
    _hooksRepository = module.get(getRepositoryToken(Hook));
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
      const mockReq: any = {
        query: { secret: 'test-jira-webhook-secret' },
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      const hooks = [{ id: 1, userId: 1, service: 'jira' }];
      const reactions = [{ id: 1, action: 'test' }];

      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockResolvedValue(reactions);
      mockReactionsService.executeReaction.mockResolvedValue(undefined);

      await controller.handleWebhook(webhookData as any, mockReq, mockRes);

      expect(mockHooksRepository.find).toHaveBeenCalledWith({
        where: { service: 'jira' },
      });
      expect(mockReactionsService.findByHookId).toHaveBeenCalledWith(1);
      expect(mockReactionsService.executeReaction).toHaveBeenCalledWith(
        reactions[0],
        webhookData,
        1
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({ success: true });
    });

    it('should handle reaction execution error', async () => {
      const webhookData = {
        webhookEvent: 'jira:issue_created',
        issue: { id: '123', key: 'TEST-1' },
      };
      const mockReq: any = {
        query: { secret: 'test-jira-webhook-secret' },
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      const hooks = [{ id: 1, userId: 1, service: 'jira' }];
      const reactions = [{ id: 1, action: 'test' }];

      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockResolvedValue(reactions);
      mockReactionsService.executeReaction.mockRejectedValue(
        new Error('Reaction failed')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await controller.handleWebhook(webhookData as any, mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Failed to execute reaction 1:`,
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({ success: true });
      consoleSpy.mockRestore();
    });

    it('should handle hook processing error', async () => {
      const webhookData = {
        webhookEvent: 'jira:issue_created',
        issue: { id: '123', key: 'TEST-1' },
      };
      const mockReq: any = {
        query: { secret: 'test-jira-webhook-secret' },
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      const hooks = [{ id: 1, userId: 1, service: 'jira' }];

      mockHooksRepository.find.mockResolvedValue(hooks);
      mockReactionsService.findByHookId.mockRejectedValue(
        new Error('Hook error')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await controller.handleWebhook(webhookData as any, mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Error processing hook 1:`,
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({ success: true });
      consoleSpy.mockRestore();
    });

    it('should handle webhook error', async () => {
      const webhookData = {
        webhookEvent: 'jira:issue_created',
        issue: { id: '123', key: 'TEST-1' },
      };
      const mockReq: any = {
        query: { secret: 'test-jira-webhook-secret' },
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      mockHooksRepository.find.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await controller.handleWebhook(webhookData as any, mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handling Jira webhook:',
        'Database error'
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        error: 'Failed to process webhook',
      });
      consoleSpy.mockRestore();
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
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

      expect(jiraService.createWebhook).toHaveBeenCalled();
      expect(result).toEqual(mockWebhook);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
      const hookId = 1;
      const mockHook = {
        id: hookId,
        userId: 1,
        webhookId: 'webhook-uuid-123',
        service: 'jira',
      };
      const mockProvider = { accessToken: 'test_token' };

      mockHooksRepository.findOne.mockResolvedValue(mockHook);
      mockAuthService.getJiraProvider.mockResolvedValue({
        ...mockProvider,
        providerId: 'cloud-123',
      });
      mockAuthService.getValidJiraToken.mockResolvedValue('test_token');
      mockJiraService.deleteWebhook.mockResolvedValue({ success: true });

      const result = await controller.deleteWebhook(mockReq, hookId);

      expect(mockHooksRepository.findOne).toHaveBeenCalledWith({
        where: { id: hookId, userId: 1, service: 'jira' },
      });
      expect(jiraService.deleteWebhook).toHaveBeenCalledWith(
        'webhook-uuid-123',
        'test_token',
        'cloud-123'
      );
      expect(result).toEqual({ message: 'Webhook deleted successfully' });
    });

    it('should throw NotFoundException when hook not found', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
      const hookId = 1;

      mockHooksRepository.findOne.mockResolvedValue(null);
      mockAuthService.getValidJiraToken.mockResolvedValue('test_token');
      mockAuthService.getJiraProvider.mockResolvedValue({
        providerId: 'cloud-123',
      });

      await expect(controller.deleteWebhook(mockReq, hookId)).rejects.toThrow(
        'Hook not found'
      );
    });

    it('should throw UnauthorizedException if provider not found', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
      const hookId = 1;

      mockAuthService.getValidJiraToken.mockResolvedValue('test_token');
      mockAuthService.getJiraProvider.mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(controller.deleteWebhook(mockReq, hookId)).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting webhook:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should handle deletion error', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
      const hookId = 1;
      const mockHook = {
        id: hookId,
        userId: 1,
        webhookId: 'webhook-uuid-123',
        service: 'jira',
      };

      mockHooksRepository.findOne.mockResolvedValue(mockHook);
      mockAuthService.getValidJiraToken.mockResolvedValue('test_token');
      mockAuthService.getJiraProvider.mockResolvedValue({
        providerId: 'cloud-123',
      });
      mockJiraService.deleteWebhook.mockRejectedValue(
        new Error('Deletion failed')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(controller.deleteWebhook(mockReq, hookId)).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting webhook:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('listProjects', () => {
    it('should list user projects', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
      const mockProjects = [{ id: '1', key: 'TEST', name: 'Test Project' }];

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.listProjects.mockResolvedValue(mockProjects);

      const result = await controller.listProjects(mockReq);

      expect(jiraService.listProjects).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProjects);
    });

    it('should handle error fetching projects', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };

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
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
      const issueKey = 'TEST-1';
      const mockIssue = { id: '123', key: issueKey, summary: 'Test Issue' };

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.getIssue.mockResolvedValue(mockIssue);

      const result = await controller.getIssue(mockReq, issueKey);

      expect(jiraService.getIssue).toHaveBeenCalledWith(1, issueKey);
      expect(result).toEqual(mockIssue);
    });

    it('should handle error fetching issue', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
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
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
      const projectKey = 'TEST';
      const mockIssues = [{ id: '123', key: 'TEST-1', summary: 'Issue 1' }];

      mockAuthService.getJiraProvider.mockResolvedValue({ id: 1 });
      mockJiraService.listProjectIssues.mockResolvedValue(mockIssues);

      const result = await controller.listProjectIssues(mockReq, projectKey);

      expect(jiraService.listProjectIssues).toHaveBeenCalledWith(1, projectKey);
      expect(result).toEqual(mockIssues);
    });

    it('should handle error fetching project issues', async () => {
      const mockReq = {
        user: { id: 1 },
        provider: { accessToken: 'test_token', providerId: 'cloud-123' },
      };
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

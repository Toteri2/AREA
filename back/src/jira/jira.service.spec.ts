import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { AuthService } from '../auth/auth.service';
import { Hook } from '../shared/entities/hook.entity';
import { JiraService } from './jira.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JiraService', () => {
  let service: JiraService;
  let hookRepository: any;

  const mockHookRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  const mockAuthService = {
    getJiraProvider: jest.fn(),
    getValidJiraToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JiraService,
        {
          provide: getRepositoryToken(Hook),
          useValue: mockHookRepository,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<JiraService>(JiraService);
    hookRepository = module.get(getRepositoryToken(Hook));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listUserWebhooks', () => {
    it('should return user webhooks', async () => {
      const mockHooks = [
        { id: 1, service: 'jira', userId: 1 },
        { id: 2, service: 'jira', userId: 1 },
      ];

      mockHookRepository.find.mockResolvedValue(mockHooks);

      const result = await service.listUserWebhooks(1);

      expect(hookRepository.find).toHaveBeenCalledWith({
        where: { service: 'jira', userId: 1 },
      });
      expect(result).toEqual(mockHooks);
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const mockDto = {
        projectKey: 'TEST',
        events: ['jira:issue_created'],
      };
      const mockProjectResponse = {
        status: 200,
        data: {
          name: 'Test Project',
        },
      };
      const mockResponse = {
        status: 200,
        data: {
          webhookRegistrationResult: [
            {
              createdWebhookId: 12345,
            },
          ],
        },
      };
      const mockHook = { id: 1, webhookId: '12345' };

      mockedAxios.get.mockResolvedValue(mockProjectResponse);
      mockedAxios.post.mockResolvedValue(mockResponse);
      mockHookRepository.create.mockReturnValue(mockHook);
      mockHookRepository.save.mockResolvedValue(mockHook);

      const result = await service.createWebhook(
        mockDto,
        'test_token',
        'cloud-123',
        'https://example.com/webhook',
        1
      );

      expect(axios.get).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalled();
      expect(hookRepository.create).toHaveBeenCalled();
      expect(hookRepository.save).toHaveBeenCalledWith(mockHook);
      expect(result).toEqual({
        success: true,
        webhookId: 12345,
        hookId: mockHook.id,
        message: 'Jira webhook created successfully',
      });
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook', async () => {
      const webhookId = '12345';
      const mockResponse = {
        status: 204,
        data: null,
      };

      mockedAxios.delete.mockResolvedValue(mockResponse);
      mockHookRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteWebhook(webhookId, 'test_token', 'cloud-123');

      expect(axios.delete).toHaveBeenCalled();
      expect(hookRepository.delete).toHaveBeenCalledWith({
        webhookId: '12345',
      });
    });

    it('should throw error on API failure', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('API Error'));

      await expect(
        service.deleteWebhook('12345', 'test_token', 'cloud-123')
      ).rejects.toThrow('API Error');
    });
  });

  describe('createWebhook error handling', () => {
    it('should throw error if response has no webhookRegistrationResult', async () => {
      const mockDto = {
        projectKey: 'TEST',
        events: ['jira:issue_created'],
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { name: 'Test Project' },
      });
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: {},
      });

      await expect(
        service.createWebhook(
          mockDto,
          'test_token',
          'cloud-123',
          'https://example.com/webhook',
          1
        )
      ).rejects.toThrow('Unexpected response from Jira API');
    });

    it('should throw error if webhook has validation errors', async () => {
      const mockDto = {
        projectKey: 'TEST',
        events: ['jira:issue_created'],
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { name: 'Test Project' },
      });
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: {
          webhookRegistrationResult: [
            {
              errors: ['Invalid project key'],
            },
          ],
        },
      });

      await expect(
        service.createWebhook(
          mockDto,
          'test_token',
          'cloud-123',
          'https://example.com/webhook',
          1
        )
      ).rejects.toThrow('Jira webhook validation failed');
    });
  });

  describe('getIssue', () => {
    it('should get issue details', async () => {
      const mockIssue = {
        key: 'TEST-123',
        fields: {
          summary: 'Test Issue',
          status: { name: 'In Progress' },
        },
      };

      mockAuthService.getJiraProvider.mockResolvedValue({
        accessToken: 'test-token',
        providerId: 'cloud-123',
      });
      mockAuthService.getValidJiraToken.mockResolvedValue('valid-token');
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockIssue,
      });

      const result = await service.getIssue(1, 'TEST-123');

      expect(result).toEqual(mockIssue);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/jira/cloud-123/rest/api/3/issue/TEST-123',
        {
          headers: {
            Authorization: 'Bearer valid-token',
            Accept: 'application/json',
          },
        }
      );
    });

    it('should throw error if provider not found', async () => {
      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(service.getIssue(1, 'TEST-123')).rejects.toThrow(
        'Jira account not linked or missing cloud ID'
      );
    });

    it('should throw error if provider missing accessToken', async () => {
      mockAuthService.getJiraProvider.mockResolvedValue({
        providerId: 'cloud-123',
      });

      await expect(service.getIssue(1, 'TEST-123')).rejects.toThrow(
        'Jira account not linked or missing cloud ID'
      );
    });
  });

  describe('listProjects', () => {
    it('should list projects', async () => {
      const mockProjects = [
        { id: '1', key: 'TEST', name: 'Test Project' },
        { id: '2', key: 'DEMO', name: 'Demo Project' },
      ];

      mockAuthService.getJiraProvider.mockResolvedValue({
        accessToken: 'test-token',
        providerId: 'cloud-123',
      });
      mockAuthService.getValidJiraToken.mockResolvedValue('valid-token');
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockProjects,
      });

      const result = await service.listProjects(1);

      expect(result).toEqual(mockProjects);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/jira/cloud-123/rest/api/3/project',
        {
          headers: {
            Authorization: 'Bearer valid-token',
            Accept: 'application/json',
          },
        }
      );
    });

    it('should throw error if provider not found', async () => {
      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(service.listProjects(1)).rejects.toThrow(
        'Jira account not linked or missing cloud ID'
      );
    });
  });

  describe('listProjectIssues', () => {
    it('should list project issues', async () => {
      const mockIssues = {
        issues: [
          { key: 'TEST-1', fields: { summary: 'Issue 1' } },
          { key: 'TEST-2', fields: { summary: 'Issue 2' } },
        ],
        total: 2,
      };

      mockAuthService.getJiraProvider.mockResolvedValue({
        accessToken: 'test-token',
        providerId: 'cloud-123',
      });
      mockAuthService.getValidJiraToken.mockResolvedValue('valid-token');
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockIssues,
      });

      const result = await service.listProjectIssues(1, 'TEST');

      expect(result).toEqual(mockIssues);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/jira/cloud-123/rest/api/3/search/jql',
        {
          jql: 'project = TEST',
          maxResults: 100,
          fields: [
            'key',
            'summary',
            'status',
            'assignee',
            'priority',
            'issuetype',
            'created',
            'updated',
          ],
        },
        {
          headers: {
            Authorization: 'Bearer valid-token',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
    });

    it('should throw error if provider not found', async () => {
      mockAuthService.getJiraProvider.mockResolvedValue(null);

      await expect(service.listProjectIssues(1, 'TEST')).rejects.toThrow(
        'Jira account not linked or missing cloud ID'
      );
    });
  });
});

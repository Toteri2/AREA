import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { GithubService } from './github.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GithubService', () => {
  let service: GithubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-webhook-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWebhook', () => {
    it('should create a webhook successfully', async () => {
      const mockResponse = {
        status: 201,
        data: {
          id: 123,
          url: 'https://api.github.com/repos/owner/repo/hooks/123',
          active: true,
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const dto = {
        owner: 'owner',
        repo: 'repo',
        events: ['push', 'pull_request'],
        secret: 'webhook-secret',
      };

      const result = await service.createWebhook(
        'github-token',
        dto,
        'https://example.com/webhook'
      );

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/hooks',
        {
          name: 'web',
          active: true,
          events: ['push', 'pull_request'],
          config: {
            url: 'https://example.com/webhook',
            content_type: 'json',
            insecure_ssl: '0',
            secret: 'test-webhook-secret',
          },
        },
        {
          headers: {
            Authorization: 'Bearer github-token',
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should create a webhook without secret', async () => {
      const mockResponse = {
        status: 201,
        data: { id: 456 },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const dto = {
        owner: 'test-owner',
        repo: 'test-repo',
        events: ['issues'],
      };

      const result = await service.createWebhook(
        'token',
        dto,
        'https://example.com/webhook'
      );

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          config: expect.objectContaining({
            secret: 'test-webhook-secret',
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('listUserRepositories', () => {
    it('should list user repositories', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1', full_name: 'user/repo1' },
        { id: 2, name: 'repo2', full_name: 'user/repo2' },
      ];

      const mockResponse = {
        status: 200,
        data: mockRepos,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listUserRepositories('github-token');

      expect(result).toEqual(mockRepos);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user/repos?per_page=100',
        {
          headers: {
            Authorization: 'Bearer github-token',
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe('listWebhooks', () => {
    it('should list webhooks for a repository', async () => {
      const mockWebhooks = [
        { id: 1, url: 'https://api.github.com/hooks/1' },
        { id: 2, url: 'https://api.github.com/hooks/2' },
      ];

      const mockResponse = {
        status: 200,
        data: mockWebhooks,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listWebhooks(
        'github-token',
        'owner',
        'repo'
      );

      expect(result).toEqual(mockWebhooks);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/hooks',
        {
          headers: {
            Authorization: 'Bearer github-token',
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers', () => {
      const headers = service.getHeaders('test-token');

      expect(headers).toEqual({
        Authorization: 'Bearer test-token',
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      });
    });
  });

  describe('handleResponse', () => {
    it('should return null for 204 status', async () => {
      const response = { status: 204 };
      const result = await service.handleResponse(response);

      expect(result).toBeNull();
    });

    it('should return response data for non-204 status', async () => {
      const mockData = { id: 1, name: 'test' };
      const response = { status: 200, data: mockData };
      const result = await service.handleResponse(response);

      expect(result).toEqual(mockData);
    });
  });
});

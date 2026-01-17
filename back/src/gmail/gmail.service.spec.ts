import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { GmailService } from './gmail.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GmailService', () => {
  let service: GmailService;
  let hookRepository: any;

  const mockHookRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  const mockReactionsService = {
    execute: jest.fn(),
    findByHookId: jest.fn(),
    executeReaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailService,
        {
          provide: getRepositoryToken(Hook),
          useValue: mockHookRepository,
        },
        {
          provide: ReactionsService,
          useValue: mockReactionsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GmailService>(GmailService);
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
        { id: 1, service: 'gmail', userId: 1 },
        { id: 2, service: 'gmail', userId: 1 },
      ];

      mockHookRepository.find.mockResolvedValue(mockHooks);

      const result = await service.listUserWebhooks(1);

      expect(hookRepository.find).toHaveBeenCalledWith({
        where: { service: 'gmail', userId: 1 },
      });
      expect(result).toEqual(mockHooks);
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const mockDto = {
        topicName: 'test-topic',
        eventType: 1,
      };
      const mockResponse = {
        status: 200,
        data: {
          historyId: '12345',
          expiration: '1234567890',
        },
      };
      const mockHook = { id: 1, webhookId: '12345' };

      mockedAxios.post.mockResolvedValue(mockResponse);
      mockHookRepository.create.mockReturnValue(mockHook);
      mockHookRepository.save.mockResolvedValue(mockHook);

      const result = await service.createWebhook(mockDto, 'test_token', 1);

      expect(axios.post).toHaveBeenCalled();
      expect(hookRepository.create).toHaveBeenCalled();
      expect(hookRepository.save).toHaveBeenCalledWith(mockHook);
      expect(result).toEqual({ valid: mockResponse.data, hookId: mockHook.id });
    });
  });

  describe('deleteSubscription', () => {
    it('should delete a subscription', async () => {
      const mockResponse = {
        status: 200,
        data: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);
      mockHookRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await service.deleteSubscription(1, 'test_token');

      expect(axios.post).toHaveBeenCalled();
      expect(hookRepository.delete).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual({ message: 'Webhook deleted successfully' });
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers', () => {
      const headers = service.getHeaders('test-token');

      expect(headers).toEqual({
        Authorization: 'Bearer test-token',
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
      const mockData = { historyId: '12345' };
      const response = { status: 200, data: mockData };
      const result = await service.handleResponse(response);

      expect(result).toEqual(mockData);
    });
  });

  describe('stopWatch', () => {
    it('should stop watch successfully', async () => {
      const mockResponse = {
        status: 200,
        data: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.stopWatch('test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://gmail.googleapis.com/gmail/v1/users/me/stop',
        {},
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('verifyEmailAddress', () => {
    it('should return true if email matches', async () => {
      const mockProfile = {
        status: 200,
        data: {
          emailAddress: 'test@example.com',
        },
      };

      mockedAxios.get.mockResolvedValue(mockProfile);

      const result = await service.verifyEmailAddress(
        'test-token',
        'test@example.com'
      );

      expect(result).toBe(true);
    });

    it('should return false if email does not match', async () => {
      const mockProfile = {
        status: 200,
        data: {
          emailAddress: 'other@example.com',
        },
      };

      mockedAxios.get.mockResolvedValue(mockProfile);

      const result = await service.verifyEmailAddress(
        'test-token',
        'test@example.com'
      );

      expect(result).toBe(false);
    });
  });

  describe('handleGmailEvent', () => {
    it('should handle MESSAGE_ADDED_INBOX event', async () => {
      const mockHook = { id: 1, eventType: 1 } as Hook;

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          history: [
            {
              messagesAdded: [{ message: { labelIds: ['INBOX'] } }],
            },
          ],
        },
      });

      const result = await service.handleGmailEvent(
        mockHook,
        'test-token',
        '12345'
      );

      expect(result).toBe(true);
    });

    it('should handle MESSAGE_ADDED event', async () => {
      const mockHook = { id: 1, eventType: 2 } as Hook;

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          history: [{ messagesAdded: [{}] }],
        },
      });

      const result = await service.handleGmailEvent(
        mockHook,
        'test-token',
        '12345'
      );

      expect(result).toBe(true);
    });

    it('should handle MESSAGE_DELETED event', async () => {
      const mockHook = { id: 1, eventType: 3 } as Hook;

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          history: [{ messagesDeleted: [{}] }],
        },
      });

      const result = await service.handleGmailEvent(
        mockHook,
        'test-token',
        '12345'
      );

      expect(result).toBe(true);
    });

    it('should return false for unknown event type', async () => {
      const mockHook = {
        id: 1,
        eventType: 999,
        userId: 1,
        webhookId: 'test',
        service: 'gmail',
      } as unknown as Hook;

      const result = await service.handleGmailEvent(
        mockHook,
        'test-token',
        '12345'
      );

      expect(result).toBe(false);
    });
  });

  describe('checkMessageAddedInbox', () => {
    it('should return true if message added to inbox', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          history: [
            {
              messagesAdded: [{ message: { labelIds: ['INBOX'] } }],
            },
          ],
        },
      });

      const result = await service.checkMessageAddedInbox(
        'test-token',
        '12345'
      );

      expect(result).toBe(true);
    });

    it('should return false if no message added to inbox', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          history: [],
        },
      });

      const result = await service.checkMessageAddedInbox(
        'test-token',
        '12345'
      );

      expect(result).toBe(false);
    });
  });

  describe('checkMessageAdded', () => {
    it('should return true if message added', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          history: [{ messagesAdded: [{}] }],
        },
      });

      const result = await service.checkMessageAdded('test-token', '12345');

      expect(result).toBe(true);
    });

    it('should return false if no message added', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { history: [] },
      });

      const result = await service.checkMessageAdded('test-token', '12345');

      expect(result).toBe(false);
    });
  });

  describe('checkMessageDeleted', () => {
    it('should return true if message deleted', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          history: [{ messagesDeleted: [{}] }],
        },
      });

      const result = await service.checkMessageDeleted('test-token', '12345');

      expect(result).toBe(true);
    });

    it('should return true if message trashed (label removed)', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          history: [
            {
              labelsRemoved: [{ labelIds: ['INBOX'] }],
            },
          ],
        },
      });

      const result = await service.checkMessageDeleted('test-token', '12345');

      expect(result).toBe(true);
    });

    it('should return false if no message deleted', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { history: [] },
      });

      const result = await service.checkMessageDeleted('test-token', '12345');

      expect(result).toBe(false);
    });
  });

  describe('executeReactions', () => {
    it('should execute reactions for hook', async () => {
      const mockHook = { id: 1 } as Hook;
      const mockReactions = [
        { id: 1, type: 'discord' },
        { id: 2, type: 'jira' },
      ];

      mockReactionsService.findByHookId.mockResolvedValue(mockReactions);
      mockReactionsService.executeReaction.mockResolvedValue(undefined);

      await service.executeReactions(
        mockHook,
        { data: 'test' },
        'test@example.com',
        '12345',
        1
      );

      expect(mockReactionsService.findByHookId).toHaveBeenCalledWith(1);
      expect(mockReactionsService.executeReaction).toHaveBeenCalledTimes(2);
    });

    it('should handle no reactions', async () => {
      const mockHook = { id: 1 } as Hook;

      mockReactionsService.findByHookId.mockResolvedValue([]);

      await service.executeReactions(
        mockHook,
        { data: 'test' },
        'test@example.com',
        '12345',
        1
      );

      expect(mockReactionsService.findByHookId).toHaveBeenCalledWith(1);
      expect(mockReactionsService.executeReaction).not.toHaveBeenCalled();
    });

    it('should continue on reaction execution error', async () => {
      const mockHook = { id: 1 } as Hook;
      const mockReactions = [
        { id: 1, type: 'discord' },
        { id: 2, type: 'jira' },
      ];

      mockReactionsService.findByHookId.mockResolvedValue(mockReactions);
      mockReactionsService.executeReaction
        .mockRejectedValueOnce(new Error('Reaction failed'))
        .mockResolvedValueOnce(undefined);

      await service.executeReactions(
        mockHook,
        { data: 'test' },
        'test@example.com',
        '12345',
        1
      );

      expect(mockReactionsService.executeReaction).toHaveBeenCalledTimes(2);
    });
  });
});

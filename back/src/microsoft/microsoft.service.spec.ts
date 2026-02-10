import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { Hook } from '../shared/entities/hook.entity';
import { MicrosoftService } from './microsoft.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MicrosoftService', () => {
  let service: MicrosoftService;
  let hookRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicrosoftService,
        {
          provide: getRepositoryToken(Hook),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MicrosoftService>(MicrosoftService);
    hookRepository = module.get(getRepositoryToken(Hook));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // describe('listUserWebhooks', () => {
  //   it('should list user webhooks successfully', async () => {
  //     const mockWebhooks = [
  //       { id: 'sub1', resource: 'me/mailFolders' },
  //       { id: 'sub2', resource: 'me/messages' },
  //     ];

  //     mockedAxios.get.mockResolvedValue({
  //       status: 200,
  //       data: { value: mockWebhooks },
  //     });

  //     const result = await service.listUserWebhooks('access-token');

  //     expect(result).toEqual(mockWebhooks);
  //     expect(mockedAxios.get).toHaveBeenCalledWith(
  //       'https://graph.microsoft.com/v1.0/subscriptions',
  //       {
  //         headers: {
  //           Authorization: 'Bearer access-token',
  //         },
  //       }
  //     );
  //   });

  //   it('should throw error if fetching webhooks fails', async () => {
  //     mockedAxios.get.mockRejectedValue(new Error('API Error'));

  //     await expect(service.listUserWebhooks('access-token')).rejects.toThrow(
  //       'Failed to fetch webhooks from Microsoft Graph API'
  //     );
  //   });
  // });

  describe('createWebhook', () => {
    it('should create a webhook successfully', async () => {
      const mockSubscription = {
        id: 'subscription-123',
        resource: 'me/mailFolders',
        changeType: 'created,updated',
      };

      mockedAxios.post.mockResolvedValue({
        status: 201,
        data: mockSubscription,
      });

      const mockHook = {
        id: 1,
        userId: 1,
        webhookId: 'subscription-123',
        service: 'microsoft',
      };

      hookRepository.create.mockReturnValue(mockHook);
      hookRepository.save.mockResolvedValue(mockHook);

      const dto = {
        changeType: ['created,updated'],
        resource: 'me/mailFolders',
      };

      const result = await service.createWebhook(
        dto,
        'access-token',
        'https://example.com/webhook',
        1,
        'random-state'
      );

      expect(result).toEqual({
        valid: mockSubscription,
        hookId: 1,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0//subscriptions',
        expect.objectContaining({
          changeType: ['created,updated'],
          notificationUrl: 'https://example.com/webhook',
          lifecycleNotificationUrl: 'https://example.com/webhook',
          resource: 'me/mailFolders',
          clientState: 'random-state',
        }),
        {
          headers: {
            Authorization: 'Bearer access-token',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(hookRepository.create).toHaveBeenCalledWith({
        userId: 1,
        webhookId: 'subscription-123',
        service: 'microsoft',
        additionalInfos: {
          resource: 'me/mailFolders',
          events: ['created,updated'],
          emailAddress: undefined,
        },
      });
      expect(hookRepository.save).toHaveBeenCalled();
    });

    it('should return null if response status is 204', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 204,
      });

      const dto = {
        changeType: ['created'],
        resource: 'me/messages',
      };

      const result = await service.createWebhook(
        dto,
        'access-token',
        'https://example.com/webhook',
        1,
        'state'
      );

      expect(result).toBeNull();
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
      const mockData = { id: 'sub-1', resource: 'me/messages' };
      const response = { status: 200, data: mockData };
      const result = await service.handleResponse(response);

      expect(result).toEqual(mockData);
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription successfully', async () => {
      mockedAxios.delete.mockResolvedValue({
        status: 204,
      });

      hookRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteSubscription(
        1,
        'access-token',
        'subscription-123'
      );

      expect(result).toBeNull();
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/subscriptions/subscription-123',
        {
          headers: {
            Authorization: 'Bearer access-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(hookRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return data for non-204 response', async () => {
      const mockData = { message: 'Deleted' };
      mockedAxios.delete.mockResolvedValue({
        status: 200,
        data: mockData,
      });

      hookRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteSubscription(
        2,
        'access-token',
        'subscription-456'
      );

      expect(result).toEqual(mockData);
    });
  });
});

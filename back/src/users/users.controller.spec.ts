import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Provider } from 'src/shared/entities/provider.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getUserWebhooks: jest.fn(),
    isUserConnected: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };
      const mockUser = { id: 1, ...userData };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(userData);

      expect(service.create).toHaveBeenCalledWith(
        userData.email,
        userData.password
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];

      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateData = { email: 'updated@example.com' };
      const mockUpdatedUser = { id: 1, ...updateData };

      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.update(1, updateData);

      expect(service.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUsersService.delete.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(service.delete).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });

  describe('getUserWebhooks', () => {
    it('should return user webhooks', async () => {
      const mockHooks = [
        { id: 1, userId: 1, webhookId: 'webhook1' },
        { id: 2, userId: 1, webhookId: 'webhook2' },
      ];
      const mockReq = { user: { id: 1 } };

      mockUsersService.getUserWebhooks.mockResolvedValue(mockHooks);

      const result = await controller.getUserWebhooks(mockReq);

      expect(service.getUserWebhooks).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockHooks);
    });
  });

  describe('isUserConnected', () => {
    it('should return connection status for valid provider', async () => {
      const mockReq = { user: { id: 1 } };

      mockUsersService.isUserConnected.mockResolvedValue(true);

      const result = await controller.isUserConnected(mockReq, 'github');

      expect(service.isUserConnected).toHaveBeenCalledWith(1, 'github');
      expect(result).toEqual({ connected: true });
    });

    it('should return false for invalid provider', async () => {
      const mockReq = { user: { id: 1 } };

      const result = await controller.isUserConnected(mockReq, 'invalid');

      expect(service.isUserConnected).not.toHaveBeenCalled();
      expect(result).toEqual({ connected: false });
    });

    it('should return false for missing provider', async () => {
      const mockReq = { user: { id: 1 } };

      const result = await controller.isUserConnected(mockReq);

      expect(service.isUserConnected).not.toHaveBeenCalled();
      expect(result).toEqual({ connected: false });
    });
  });
});

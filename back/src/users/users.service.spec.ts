import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Hook } from '../shared/entities/hook.entity';
import { Provider } from '../shared/entities/provider.entity';
import { User } from '../shared/entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: any;
  let hooksRepository: any;
  let providersRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Hook),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
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

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    hooksRepository = module.get(getRepositoryToken(Hook));
    providersRepository = module.get(getRepositoryToken(Provider));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.create('test@example.com', 'password123');

      expect(usersRepository.create).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];

      usersRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(usersRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
      };

      usersRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null if user not found', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user and return updated user', async () => {
      const mockUser = {
        id: 1,
        email: 'updated@example.com',
      };

      usersRepository.update.mockResolvedValue({ affected: 1 });
      usersRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.update(1, { email: 'updated@example.com' });

      expect(usersRepository.update).toHaveBeenCalledWith(1, {
        email: 'updated@example.com',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user to update not found', async () => {
      usersRepository.update.mockResolvedValue({ affected: 0 });
      usersRepository.findOneBy.mockResolvedValue(null);

      const result = await service.update(999, { email: 'test@example.com' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(usersRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('checkPass', () => {
    it('should return true for correct password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser: any = hashedPassword;

      const result = await service.checkPass(mockUser, 'password123');

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser: any = hashedPassword;

      const result = await service.checkPass(mockUser, 'wrongpassword');

      expect(result).toBe(false);
    });
  });

  describe('getUserWebhooks', () => {
    it('should return user webhooks', async () => {
      const mockHooks = [
        {
          id: 1,
          userId: 1,
          webhookId: 'webhook1',
          service: 'gmail',
          eventType: 'message',
        },
        {
          id: 2,
          userId: 1,
          webhookId: 'webhook2',
          service: 'microsoft',
          eventType: 'email',
        },
      ];

      hooksRepository.find.mockResolvedValue(mockHooks);

      const result = await service.getUserWebhooks(1);

      expect(result).toEqual([
        {
          id: 1,
          userId: 1,
          service: 'gmail',
          eventType: 'message',
          lastHistoryId: undefined,
        },
        {
          id: 2,
          userId: 1,
          service: 'microsoft',
          eventType: 'email',
          lastHistoryId: undefined,
        },
      ]);
      expect(hooksRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should return empty array if no webhooks', async () => {
      hooksRepository.find.mockResolvedValue([]);

      const result = await service.getUserWebhooks(1);

      expect(result).toEqual([]);
    });
  });

  describe('isUserConnected', () => {
    it('should return true if user is connected to provider', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: 'github',
      };

      providersRepository.findOne.mockResolvedValue(mockProvider);

      const result = await service.isUserConnected(1, 'github' as any);

      expect(result).toBe(true);
      expect(providersRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1, provider: 'github' },
      });
    });

    it('should return false if user is not connected to provider', async () => {
      providersRepository.findOne.mockResolvedValue(null);

      const result = await service.isUserConnected(1, 'github' as any);

      expect(result).toBe(false);
    });
  });
});

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OAuthState } from '../shared/entities/oauthstates.entity';
import { Provider } from '../shared/entities/provider.entity';
import { User } from '../shared/entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let providerRepository: any;
  let oauthStatesRepository: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Provider),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OAuthState),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                DISCORD_CLIENT_ID: 'test-discord-client-id',
                DISCORD_CLIENT_SECRET: 'test-discord-secret',
                GITHUB_CLIENT_ID: 'test-github-client-id',
                GITHUB_CLIENT_SECRET: 'test-github-secret',
                GOOGLE_CLIENT_ID: 'test-google-client-id',
                GOOGLE_CLIENT_SECRET: 'test-google-secret',
                MICROSOFT_CLIENT_ID: 'test-microsoft-client-id',
                MICROSOFT_CLIENT_SECRET: 'test-microsoft-secret',
                JIRA_CLIENT_ID: 'test-jira-client-id',
                JIRA_CLIENT_SECRET: 'test-jira-secret',
                JWT_SECRET: 'test-jwt-secret',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return config[key];
            }),
            getOrThrow: jest.fn((key: string) => {
              const config = {
                DISCORD_CLIENT_ID: 'test-discord-client-id',
                DISCORD_CLIENT_SECRET: 'test-discord-secret',
                GITHUB_CLIENT_ID: 'test-github-client-id',
                GITHUB_CLIENT_SECRET: 'test-github-secret',
                GOOGLE_CLIENT_ID: 'test-google-client-id',
                GOOGLE_CLIENT_SECRET: 'test-google-secret',
                MICROSOFT_CLIENT_ID: 'test-microsoft-client-id',
                MICROSOFT_CLIENT_SECRET: 'test-microsoft-secret',
                JIRA_CLIENT_ID: 'test-jira-client-id',
                JIRA_CLIENT_SECRET: 'test-jira-secret',
                JWT_SECRET: 'test-jwt-secret',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    providerRepository = module.get(getRepositoryToken(Provider));
    oauthStatesRepository = module.get(getRepositoryToken(OAuthState));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user with hashed password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      };

      userRepository.create = jest.fn().mockReturnValue(mockUser);
      userRepository.save = jest.fn().mockResolvedValue(mockUser);

      const result = await service.register(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: await require('bcrypt').hash('password123', 10),
      };

      userRepository.findOneBy = jest.fn().mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'password123'
      );

      expect(result).toBeTruthy();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      userRepository.findOneBy = jest.fn().mockResolvedValue(null);

      const result = await service.validateUser(
        'wrong@example.com',
        'password123'
      );

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: await require('bcrypt').hash('password123', 10),
      };

      userRepository.findOneBy = jest.fn().mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword'
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      jwtService.sign = jest.fn().mockReturnValue('jwt-token');

      const result = await service.login(mockUser as any);

      expect(result.access_token).toBe('jwt-token');
      expect(result.user).toEqual(mockUser);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });
  });

  describe('linkGithubAccount', () => {
    it('should create new GitHub provider if not exists', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: 'github',
        accessToken: 'github_token',
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(null);
      providerRepository.create = jest.fn().mockReturnValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.linkGithubAccount(1, 'github_token');

      expect(providerRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockProvider);
    });

    it('should update existing GitHub provider', async () => {
      const existingProvider = {
        id: 1,
        userId: 1,
        provider: 'github',
        accessToken: 'old_token',
      };

      providerRepository.findOne = jest
        .fn()
        .mockResolvedValue(existingProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...existingProvider,
        accessToken: 'new_token',
      });

      const result = await service.linkGithubAccount(1, 'new_token');

      expect(providerRepository.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('new_token');
    });
  });

  describe('getGithubProvider', () => {
    it('should return GitHub provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: 'github',
        accessToken: 'github_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getGithubProvider(1);

      expect(result).toEqual(mockProvider);
    });

    it('should return null if no provider exists', async () => {
      providerRepository.findOneBy = jest.fn().mockResolvedValue(null);

      const result = await service.getGithubProvider(1);

      expect(result).toBeNull();
    });
  });

  describe('linkDiscordAccount', () => {
    it('should create new Discord provider if not exists', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: 'discord',
        accessToken: 'discord_token',
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(null);
      providerRepository.create = jest.fn().mockReturnValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.linkDiscordAccount(1, 'discord_token');

      expect(result).toEqual(mockProvider);
    });

    it('should update existing Discord provider', async () => {
      const existingProvider = {
        id: 1,
        userId: 1,
        provider: 'discord',
        accessToken: 'old_token',
      };

      providerRepository.findOne = jest
        .fn()
        .mockResolvedValue(existingProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...existingProvider,
        accessToken: 'new_token',
      });

      const result = await service.linkDiscordAccount(1, 'new_token');

      expect(result.accessToken).toBe('new_token');
    });
  });

  describe('getDiscordProvider', () => {
    it('should return Discord provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: 'discord',
        accessToken: 'discord_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getDiscordProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });

  describe('getMicrosoftProvider', () => {
    it('should return Microsoft provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: 'microsoft',
        accessToken: 'microsoft_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getMicrosoftProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });

  describe('getGmailProvider', () => {
    it('should return Gmail provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: 'gmail',
        accessToken: 'gmail_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getGmailProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });

  describe('getJiraProvider', () => {
    it('should return Jira provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: 'jira',
        accessToken: 'jira_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getJiraProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });

  describe('verifyToken', () => {
    it('should return decoded token if valid', async () => {
      const mockPayload = { sub: 1, email: 'test@example.com' };

      jwtService.verify = jest.fn().mockReturnValue(mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('should return null if token is invalid', async () => {
      jwtService.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.verifyToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('createOAuthStateToken', () => {
    it('should create and save OAuth state token', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockState = {
        userId: 1,
        state: 'random-state',
        provider: 'github',
        expiresAt: new Date(),
      };

      userRepository.findOneBy = jest.fn().mockResolvedValue(mockUser);
      oauthStatesRepository.create = jest.fn().mockReturnValue(mockState);
      oauthStatesRepository.save = jest.fn().mockResolvedValue(mockState);

      const result = await service.createOAuthStateToken(1, 'github' as any);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(oauthStatesRepository.save).toHaveBeenCalled();
    });

    it('should return empty string if user not found', async () => {
      userRepository.findOneBy = jest.fn().mockResolvedValue(null);

      const result = await service.createOAuthStateToken(999, 'github' as any);

      expect(result).toBe('');
    });
  });

  describe('validateOAuthState', () => {
    it('should return userId if state is valid', async () => {
      const futureDate = new Date(Date.now() + 60000);
      const mockState = {
        userId: 1,
        state: 'valid-state',
        expiresAt: futureDate,
        provider: 'github',
      };

      oauthStatesRepository.findOneBy = jest.fn().mockResolvedValue(mockState);
      oauthStatesRepository.delete = jest.fn();

      const result = await service.validateOAuthState(
        'valid-state',
        'github' as any
      );

      expect(result).toBe(1);
      expect(oauthStatesRepository.delete).toHaveBeenCalled();
    });

    it('should return null and delete if state expired', async () => {
      const pastDate = new Date(Date.now() - 60000);
      const mockState = {
        userId: 1,
        state: 'expired-state',
        expiresAt: pastDate,
        provider: 'github',
      };

      oauthStatesRepository.findOneBy = jest.fn().mockResolvedValue(mockState);
      oauthStatesRepository.delete = jest.fn();

      const result = await service.validateOAuthState(
        'expired-state',
        'github' as any
      );

      expect(result).toBeNull();
      expect(oauthStatesRepository.delete).toHaveBeenCalled();
    });

    it('should return null if state not found', async () => {
      oauthStatesRepository.findOneBy = jest.fn().mockResolvedValue(null);
      oauthStatesRepository.delete = jest.fn();

      const result = await service.validateOAuthState(
        'unknown-state',
        'github' as any
      );

      expect(result).toBeNull();
      expect(oauthStatesRepository.delete).toHaveBeenCalled();
    });
  });
});

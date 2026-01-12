import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { OAuthState } from '../shared/entities/oauthstates.entity';
import { Provider } from '../shared/entities/provider.entity';
import { User } from '../shared/entities/user.entity';
import { ProviderType } from '../shared/enums/provider.enum';
import { AuthService } from './auth.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  describe('getGithubToken', () => {
    it('should exchange code for GitHub access token', async () => {
      const mockResponse = {
        data: { access_token: 'github_access_token' },
      };

      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValue(mockResponse);

      const result = await service.getGithubToken('auth_code');

      expect(result).toBe('github_access_token');
    });
  });

  describe('getDiscordProvider', () => {
    it('should return Discord provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.DISCORD,
        accessToken: 'discord_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getDiscordProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });

  describe('getGmailProvider', () => {
    it('should return Gmail provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: 'gmail_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getGmailProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });

  describe('getMicrosoftProvider', () => {
    it('should return Microsoft provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.MICROSOFT,
        accessToken: 'microsoft_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getMicrosoftProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });

  describe('getJiraProvider', () => {
    it('should return Jira provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.JIRA,
        accessToken: 'jira_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getJiraProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });

  describe('getMicrosoftToken', () => {
    it('should throw error if no provider', async () => {
      providerRepository.findOneBy = jest.fn().mockResolvedValue(null);

      await expect(service.getMicrosoftToken(1)).rejects.toThrow(
        'Microsoft account not linked'
      );
    });
  });

  describe('findOauthState', () => {
    it('should return true if state found', async () => {
      const mockState = {
        id: 1,
        userId: 1,
        state: 'test-state',
        provider: ProviderType.GITHUB,
      };

      oauthStatesRepository.findOneBy = jest.fn().mockResolvedValue(mockState);

      const result = await service.findOauthState(
        'test-state',
        ProviderType.GITHUB
      );

      expect(result).toBe(true);
    });

    it('should return false if not found', async () => {
      oauthStatesRepository.findOneBy = jest.fn().mockResolvedValue(null);

      const result = await service.findOauthState(
        'unknown-state',
        ProviderType.GITHUB
      );

      expect(result).toBe(false);
    });
  });

  describe('linkDiscordAccount', () => {
    it('should create new Discord provider if not exists', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.DISCORD,
        accessToken: 'discord_token',
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(null);
      providerRepository.create = jest.fn().mockReturnValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.linkDiscordAccount(1, 'discord_token');

      expect(providerRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockProvider);
    });

    it('should update existing Discord provider', async () => {
      const existingProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.DISCORD,
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

      expect(providerRepository.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('new_token');
    });
  });

  describe('linkTwitchAccount', () => {
    it('should create new Twitch provider if not exists', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.TWITCH,
        accessToken: 'twitch_token',
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(null);
      providerRepository.create = jest.fn().mockReturnValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.linkTwitchAccount(1, 'twitch_token');

      expect(providerRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockProvider);
    });

    it('should update existing Twitch provider', async () => {
      const existingProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.TWITCH,
        accessToken: 'old_token',
      };

      providerRepository.findOne = jest
        .fn()
        .mockResolvedValue(existingProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...existingProvider,
        accessToken: 'new_token',
      });

      const result = await service.linkTwitchAccount(1, 'new_token');

      expect(providerRepository.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('new_token');
    });
  });

  describe('verifyToken', () => {
    it('should return decoded token if valid', async () => {
      const mockDecoded = { sub: 1, email: 'test@example.com' };
      jwtService.verify = jest.fn().mockReturnValue(mockDecoded);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
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
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      const mockState = {
        id: 1,
        userId: 1,
        state: 'random-state',
        provider: ProviderType.DISCORD,
        expiresAt: new Date(),
      };

      userRepository.findOneBy = jest.fn().mockResolvedValue(mockUser);
      oauthStatesRepository.create = jest.fn().mockReturnValue(mockState);
      oauthStatesRepository.save = jest.fn().mockResolvedValue(mockState);

      const result = await service.createOAuthStateToken(
        1,
        ProviderType.DISCORD
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(oauthStatesRepository.create).toHaveBeenCalled();
      expect(oauthStatesRepository.save).toHaveBeenCalled();
    });

    it('should return empty string if user not found', async () => {
      userRepository.findOneBy = jest.fn().mockResolvedValue(null);

      const result = await service.createOAuthStateToken(
        999,
        ProviderType.DISCORD
      );

      expect(result).toBe('');
    });
  });

  describe('validateOAuthState', () => {
    it('should return userId for valid state', async () => {
      const mockState = {
        id: 1,
        userId: 1,
        state: 'valid-state',
        provider: ProviderType.DISCORD,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      oauthStatesRepository.findOneBy = jest.fn().mockResolvedValue(mockState);
      oauthStatesRepository.delete = jest.fn().mockResolvedValue({});

      const result = await service.validateOAuthState(
        'valid-state',
        ProviderType.DISCORD
      );

      expect(result).toBe(1);
      expect(oauthStatesRepository.delete).toHaveBeenCalledWith({
        state: 'valid-state',
        provider: ProviderType.DISCORD,
      });
    });

    it('should return null for expired state', async () => {
      const mockState = {
        id: 1,
        userId: 1,
        state: 'expired-state',
        provider: ProviderType.DISCORD,
        expiresAt: new Date(Date.now() - 1000),
      };

      oauthStatesRepository.findOneBy = jest.fn().mockResolvedValue(mockState);
      oauthStatesRepository.delete = jest.fn().mockResolvedValue({});

      const result = await service.validateOAuthState(
        'expired-state',
        ProviderType.DISCORD
      );

      expect(result).toBeNull();
      expect(oauthStatesRepository.delete).toHaveBeenCalled();
    });

    it('should return null for non-existent state', async () => {
      oauthStatesRepository.findOneBy = jest.fn().mockResolvedValue(null);

      const result = await service.validateOAuthState(
        'non-existent',
        ProviderType.DISCORD
      );

      expect(result).toBeNull();
    });
  });

  describe('linkGmailAccount', () => {
    it('should create new Gmail provider with refresh token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: 'gmail_access_token',
        refreshToken: 'gmail_refresh_token',
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(null);
      providerRepository.create = jest.fn().mockReturnValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.linkGmailAccount(
        1,
        'gmail_access_token',
        'gmail_refresh_token'
      );

      expect(providerRepository.create).toHaveBeenCalledWith({
        userId: 1,
        user: { id: 1 },
        provider: ProviderType.GMAIL,
        accessToken: 'gmail_access_token',
        refreshToken: 'gmail_refresh_token',
      });
      expect(result).toEqual(mockProvider);
    });

    it('should update existing Gmail provider', async () => {
      const existingProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: 'old_token',
        refreshToken: 'old_refresh',
      };

      providerRepository.findOne = jest
        .fn()
        .mockResolvedValue(existingProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...existingProvider,
        accessToken: 'new_token',
        refreshToken: 'new_refresh',
      });

      const result = await service.linkGmailAccount(
        1,
        'new_token',
        'new_refresh'
      );

      expect(result.accessToken).toBe('new_token');
      expect(result.refreshToken).toBe('new_refresh');
    });
  });

  describe('linkJiraAccount', () => {
    it('should create new Jira provider with cloudId', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.JIRA,
        accessToken: 'jira_access_token',
        refreshToken: 'jira_refresh_token',
        providerId: 'cloud-id-123',
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(null);
      providerRepository.create = jest.fn().mockReturnValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.linkJiraAccount(
        1,
        'jira_access_token',
        'jira_refresh_token',
        'cloud-id-123'
      );

      expect(providerRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockProvider);
    });

    it('should update existing Jira provider', async () => {
      const existingProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.JIRA,
        accessToken: 'old_token',
      };

      providerRepository.findOne = jest
        .fn()
        .mockResolvedValue(existingProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...existingProvider,
        accessToken: 'new_token',
        refreshToken: 'new_refresh',
        providerId: 'new-cloud-id',
      });

      const result = await service.linkJiraAccount(
        1,
        'new_token',
        'new_refresh',
        'new-cloud-id'
      );

      expect(result.accessToken).toBe('new_token');
      expect(result.providerId).toBe('new-cloud-id');
    });
  });

  describe('getStoredGmailToken', () => {
    it('should return stored Gmail access token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: 'stored_gmail_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getStoredGmailToken(1);

      expect(result).toBe('stored_gmail_token');
    });

    it('should throw error if Gmail account not linked', async () => {
      providerRepository.findOneBy = jest.fn().mockResolvedValue(null);

      await expect(service.getStoredGmailToken(1)).rejects.toThrow(
        'Gmail account not linked'
      );
    });

    it('should throw error if no access token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: null,
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      await expect(service.getStoredGmailToken(1)).rejects.toThrow(
        'Gmail account not linked'
      );
    });
  });

  describe('findOrCreateGoogleUser', () => {
    it('should return existing user if found', async () => {
      const existingUser = {
        id: 1,
        email: 'test@gmail.com',
        name: 'Test User',
        password: 'hashed',
      };

      userRepository.findOne = jest.fn().mockResolvedValue(existingUser);

      const result = await service.findOrCreateGoogleUser(
        'test@gmail.com',
        'Test User',
        'google-id-123'
      );

      expect(result).toEqual(existingUser);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should create new user if not found', async () => {
      const newUser = {
        id: 2,
        email: 'new@gmail.com',
        name: 'New User',
        password: 'random-hashed',
      };

      userRepository.findOne = jest.fn().mockResolvedValue(null);
      userRepository.create = jest.fn().mockReturnValue(newUser);
      userRepository.save = jest.fn().mockResolvedValue(newUser);

      const result = await service.findOrCreateGoogleUser(
        'new@gmail.com',
        'New User',
        'google-id-456'
      );

      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.email).toBe('new@gmail.com');
    });
  });

  describe('getMicrosoftAuthUrl', () => {
    it('should return Microsoft auth URL', async () => {
      const url = await service.getMicrosoftAuthUrl();

      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
    });
  });

  describe('getDiscordToken', () => {
    it('should fetch Discord access token', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'discord-access-token' },
      });

      const result = await service.getDiscordToken('discord-code');

      expect(result).toBe('discord-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/v10/oauth2/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });
  });

  describe('getGmailToken', () => {
    it('should fetch Gmail access and refresh tokens', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: {
          access_token: 'gmail-access-token',
          refresh_token: 'gmail-refresh-token',
        },
      });

      const result = await service.getGmailToken('gmail-code');

      expect(result.accessToken).toBe('gmail-access-token');
      expect(result.refreshToken).toBe('gmail-refresh-token');
    });

    it('should throw error on failed token request', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { data: { error: 'invalid_grant' } },
        message: 'Request failed',
      });

      await expect(service.getGmailToken('invalid-code')).rejects.toThrow(
        'Failed to get Gmail access token'
      );
    });
  });

  describe('refreshGmailToken', () => {
    it('should refresh Gmail access token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: 'old-token',
        refreshToken: 'gmail-refresh-token',
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...mockProvider,
        accessToken: 'new-access-token',
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'new-access-token' },
      });

      const result = await service.refreshGmailToken(1);

      expect(result).toBe('new-access-token');
      expect(providerRepository.save).toHaveBeenCalled();
    });

    it('should throw error if no refresh token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: 'token',
        refreshToken: null,
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(mockProvider);

      await expect(service.refreshGmailToken(1)).rejects.toThrow(
        'Gmail refresh token not found'
      );
    });
  });

  describe('getValidGmailToken', () => {
    it('should return valid Gmail token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: 'valid-token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { emailAddress: 'test@gmail.com' },
      });

      const result = await service.getValidGmailToken(1);

      expect(result).toBe('valid-token');
    });

    it('should refresh token if 401 error', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.GMAIL,
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);
      providerRepository.findOne = jest.fn().mockResolvedValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...mockProvider,
        accessToken: 'new-token',
      });

      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401 },
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'new-token' },
      });

      const result = await service.getValidGmailToken(1);

      expect(result).toBe('new-token');
    });
  });

  describe('getJiraToken', () => {
    it('should fetch Jira access and refresh tokens', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: {
          access_token: 'jira-access-token',
          refresh_token: 'jira-refresh-token',
        },
      });

      const result = await service.getJiraToken('jira-code');

      expect(result.accessToken).toBe('jira-access-token');
      expect(result.refreshToken).toBe('jira-refresh-token');
    });

    it('should throw error for invalid code', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 400 },
      });

      await expect(service.getJiraToken('invalid-code')).rejects.toThrow(
        'Invalid or expired authorization code'
      );
    });
  });

  describe('getJiraCloudId', () => {
    it('should return Jira cloud ID', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: [{ id: 'cloud-id-123', name: 'Test Site' }],
      });

      const result = await service.getJiraCloudId('jira-access-token');

      expect(result).toBe('cloud-id-123');
    });

    it('should throw error if no resources found', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: [],
      });

      await expect(service.getJiraCloudId('jira-access-token')).rejects.toThrow(
        'No Jira cloud resources found'
      );
    });
  });

  describe('refreshJiraToken', () => {
    it('should refresh Jira access token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.JIRA,
        accessToken: 'old-token',
        refreshToken: 'jira-refresh-token',
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...mockProvider,
        accessToken: 'new-jira-token',
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: {
          access_token: 'new-jira-token',
          refresh_token: 'new-refresh-token',
        },
      });

      const result = await service.refreshJiraToken(1);

      expect(result).toBe('new-jira-token');
    });

    it('should throw error if no refresh token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.JIRA,
        accessToken: 'token',
        refreshToken: null,
      };

      providerRepository.findOne = jest.fn().mockResolvedValue(mockProvider);

      await expect(service.refreshJiraToken(1)).rejects.toThrow(
        'Jira refresh token not found'
      );
    });
  });

  describe('getValidJiraToken', () => {
    it('should return valid Jira token', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.JIRA,
        accessToken: 'valid-jira-token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: [{ id: 'cloud-id' }],
      });

      const result = await service.getValidJiraToken(1);

      expect(result).toBe('valid-jira-token');
    });

    it('should refresh token if 401 error', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.JIRA,
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);
      providerRepository.findOne = jest.fn().mockResolvedValue(mockProvider);
      providerRepository.save = jest.fn().mockResolvedValue({
        ...mockProvider,
        accessToken: 'new-token',
      });

      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401 },
      });

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'new-token', refresh_token: 'new-refresh' },
      });

      const result = await service.getValidJiraToken(1);

      expect(result).toBe('new-token');
    });
  });

  describe('getGoogleUserInfo', () => {
    it('should return Google user info', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'google-access-token' },
      });

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {
          email: 'test@gmail.com',
          name: 'Test User',
        },
      });

      const result = await service.getGoogleUserInfo('google-code');

      expect(result.accessToken).toBe('google-access-token');
      expect(result.email).toBe('test@gmail.com');
      expect(result.name).toBe('Test User');
    });

    it('should throw error on failed request', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { data: { error: 'invalid_grant' } },
        message: 'Request failed',
      });

      await expect(service.getGoogleUserInfo('invalid-code')).rejects.toThrow(
        'Failed to get Google user info'
      );
    });
  });

  describe('getTwitchToken', () => {
    it('should fetch Twitch access token', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'twitch-access-token' },
      });

      const result = await service.getTwitchToken('twitch-code');

      expect(result).toBe('twitch-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });
  });

  describe('getTwitchProvider', () => {
    it('should return Twitch provider for user', async () => {
      const mockProvider = {
        id: 1,
        userId: 1,
        provider: ProviderType.TWITCH,
        accessToken: 'twitch_token',
      };

      providerRepository.findOneBy = jest.fn().mockResolvedValue(mockProvider);

      const result = await service.getTwitchProvider(1);

      expect(result).toEqual(mockProvider);
    });
  });
});

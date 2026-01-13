import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OAuthState } from '../shared/entities/oauthstates.entity';
import { Provider } from '../shared/entities/provider.entity';
import { User } from '../shared/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let _userRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
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
            remove: jest.fn(),
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
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OAuthState),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt-token'),
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

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    _userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return user data', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockUser as User);

      await controller.register(
        {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
        mockRes
      );

      expect(authService.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        token: 'fake-jwt-token',
      });
    });

    it('should return 409 if credentials are already in use', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      const error = new Error();
      (error as any).code = '23505';

      jest.spyOn(authService, 'register').mockRejectedValue(error);

      await controller.register(
        {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
        mockRes
      );
      expect(authService.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User'
      );
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'Credentials already in use',
      });
    });

    it('should throw error for unexpected registration errors', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      const error = new Error('Database connection failed');
      (error as any).code = 'ECONNREFUSED';

      jest.spyOn(authService, 'register').mockRejectedValue(error);

      await expect(
        controller.register(
          {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          },
          mockRes
        )
      ).rejects.toThrow('Database connection failed');

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.send).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
      };

      const mockLoginResponse = {
        access_token: 'fake-jwt-token',
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      jest
        .spyOn(authService, 'validateUser')
        .mockResolvedValue(mockUser as User);
      jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

      await controller.login(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        mockRes
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith(mockLoginResponse);
    });

    it('should return 401 when credentials are invalid', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await controller.login(
        {
          email: 'wrong@example.com',
          password: 'wrongpassword',
        },
        mockRes
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile from request', async () => {
      const mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  describe('githubAuthUrl', () => {
    it('should return GitHub OAuth URL with encoded state', async () => {
      const result = await controller.githubAuthUrl('false');

      expect(result).toContain('github.com/login/oauth/authorize');
      expect(result).toContain('client_id=');
      expect(result).toContain('redirect_uri=');
      expect(result).toContain('state=');
      expect(result).toContain('scope=user:email');
    });

    it('should include mobile platform in state when mobile=true', async () => {
      const result = await controller.githubAuthUrl('true');
      const stateParam = result.split('state=')[1];
      const decodedState = JSON.parse(
        Buffer.from(stateParam, 'base64').toString()
      );

      expect(decodedState.platform).toBe('mobile');
      expect(decodedState.nonce).toBeDefined();
    });
  });

  describe('githubAuthCallback', () => {
    it('should link GitHub account and return success', async () => {
      const mockRequest = {
        user: { id: 1, name: 'Test User' },
      };

      const mockBody = { code: 'github-auth-code-123' };

      jest
        .spyOn(authService, 'getGithubToken')
        .mockResolvedValue('github-access-token');
      jest
        .spyOn(authService, 'linkGithubAccount')
        .mockResolvedValue({} as Provider);

      const result = await controller.githubAuthCallback(mockBody, mockRequest);

      expect(authService.getGithubToken).toHaveBeenCalledWith(
        'github-auth-code-123'
      );
      expect(authService.linkGithubAccount).toHaveBeenCalledWith(
        1,
        'github-access-token'
      );
      expect(result).toEqual({ success: true, user: 'Test User' });
    });

    it('should throw error when userId is not present', async () => {
      const mockRequest = {
        user: { id: null, name: 'Test User' },
      };

      const mockBody = { code: 'github-auth-code-123' };

      await expect(
        controller.githubAuthCallback(mockBody, mockRequest)
      ).rejects.toThrow('No session found');
    });

    it('should propagate error from getGithubToken', async () => {
      const mockRequest = {
        user: { id: 1, name: 'Test User' },
      };

      const mockBody = { code: 'invalid-code' };

      jest
        .spyOn(authService, 'getGithubToken')
        .mockRejectedValue(new Error('Invalid GitHub code'));

      await expect(
        controller.githubAuthCallback(mockBody, mockRequest)
      ).rejects.toThrow('Invalid GitHub code');
    });
  });

  describe('microsoftAuthUrl', () => {
    it('should return Microsoft OAuth URL', async () => {
      const result = await controller.microsoftAuthUrl('false');

      expect(result).toContain('login.microsoftonline.com');
      expect(result).toContain('client_id=');
      expect(result).toContain('response_type=code');
      expect(result).toContain('state=');
    });

    it('should include mobile platform in state when mobile=true', async () => {
      const result = await controller.microsoftAuthUrl('true');
      const stateParam = result.split('state=')[1].split('&')[0];
      const decodedState = JSON.parse(
        Buffer.from(stateParam, 'base64').toString()
      );

      expect(decodedState.platform).toBe('mobile');
    });
  });

  describe('microsoftAuthValidate', () => {
    it('should link Microsoft account successfully', async () => {
      const mockRequest = {
        user: { id: 1, name: 'Test User' },
      };

      jest
        .spyOn(authService, 'linkMicrosoftAccount')
        .mockResolvedValue({} as Provider);

      const result = await controller.microsoftAuthValidate(
        { code: 'ms-code' },
        mockRequest
      );

      expect(result).toEqual({ success: true, user: 'Test User' });
      expect(authService.linkMicrosoftAccount).toHaveBeenCalledWith(
        1,
        'ms-code'
      );
    });
  });

  describe('getDiscordAuthUrl', () => {
    it('should return Discord OAuth URL with state', async () => {
      const mockRequest = {
        session: { userId: 1 },
      };

      jest
        .spyOn(authService, 'createOAuthStateToken')
        .mockResolvedValue('discord-state-123');

      const result = await controller.getDiscordAuthUrl(mockRequest);

      expect(result).toContain('discord.com/api/oauth2/authorize');
      expect(result).toContain('state=discord-state-123');
      expect(result).toContain('scope=');
    });
  });

  describe('discordAuthState', () => {
    it('should return OAuth state token', async () => {
      const mockRequest = {
        session: { userId: 1 },
      };

      jest
        .spyOn(authService, 'createOAuthStateToken')
        .mockResolvedValue('state-token-xyz');

      const result = await controller.discordAuthState(mockRequest);

      expect(result).toBe('state-token-xyz');
    });
  });

  describe('discordAuthCallback', () => {
    it('should link Discord account successfully', async () => {
      jest.spyOn(authService, 'validateOAuthState').mockResolvedValue(1);
      jest
        .spyOn(authService, 'getDiscordToken')
        .mockResolvedValue('discord-token');
      jest
        .spyOn(authService, 'linkDiscordAccount')
        .mockResolvedValue({} as Provider);

      const result = await controller.discordAuthCallback({
        code: 'discord-code',
        state: 'valid-state',
      });

      expect(result).toEqual({
        success: true,
        message: 'Discord account linked successfully',
      });
    });

    it('should throw error for invalid state', async () => {
      jest.spyOn(authService, 'validateOAuthState').mockResolvedValue(null);

      await expect(
        controller.discordAuthCallback({
          code: 'discord-code',
          state: 'invalid-state',
        })
      ).rejects.toThrow('Invalid or expired state token');
    });
  });

  describe('getTwitchAuthUrl', () => {
    it('should return Twitch OAuth URL', async () => {
      const mockRequest = {
        session: { userId: 1 },
      };

      jest
        .spyOn(authService, 'createOAuthStateToken')
        .mockResolvedValue('twitch-state');

      const result = await controller.getTwitchAuthUrl(mockRequest);

      expect(result).toContain('id.twitch.tv/oauth2/authorize');
      expect(result).toContain('state=twitch-state');
    });
  });

  describe('twitchAuthCallback', () => {
    it('should link Twitch account successfully', async () => {
      jest.spyOn(authService, 'validateOAuthState').mockResolvedValue(1);
      jest
        .spyOn(authService, 'getTwitchToken')
        .mockResolvedValue('twitch-token');
      jest
        .spyOn(authService, 'linkTwitchAccount')
        .mockResolvedValue({} as Provider);

      const result = await controller.twitchAuthCallback({
        code: 'twitch-code',
        state: 'valid-state',
      });

      expect(result).toEqual({
        success: true,
        message: 'Twitch account linked successfully',
      });
    });

    it('should throw error for invalid state', async () => {
      jest.spyOn(authService, 'validateOAuthState').mockResolvedValue(null);

      await expect(
        controller.twitchAuthCallback({
          code: 'twitch-code',
          state: 'invalid-state',
        })
      ).rejects.toThrow('Invalid or expired state token');
    });
  });

  describe('gmailAuthUrl', () => {
    it('should return Gmail OAuth URL', async () => {
      const result = await controller.gmailAuthUrl('false');

      expect(result).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(result).toContain('scope=https://www.googleapis.com');
      expect(result).toContain('access_type=offline');
    });
  });

  describe('gmailAuthCallback', () => {
    it('should link Gmail account successfully', async () => {
      const mockRequest = {
        user: { id: 1, name: 'Test User' },
      };

      jest.spyOn(authService, 'getGmailToken').mockResolvedValue({
        accessToken: 'gmail-access',
        refreshToken: 'gmail-refresh',
      });
      jest
        .spyOn(authService, 'linkGmailAccount')
        .mockResolvedValue({} as Provider);

      const result = await controller.gmailAuthCallback(
        { code: 'gmail-code' },
        mockRequest
      );

      expect(result).toEqual({ success: true, user: 'Test User' });
    });

    it('should throw error when no userId', async () => {
      const mockRequest = {
        user: { id: null, name: 'Test User' },
      };

      await expect(
        controller.gmailAuthCallback({ code: 'gmail-code' }, mockRequest)
      ).rejects.toThrow('No session found');
    });
  });

  describe('googleAuthUrl', () => {
    it('should return Google OAuth URL for login', async () => {
      const result = await controller.googleAuthUrl('false');

      expect(result).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(result).toContain('scope=');
    });
  });

  describe('googleAuthCallback', () => {
    it('should authenticate user via Google', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      const mockUser = {
        id: 1,
        email: 'test@gmail.com',
        name: 'Test User',
      };

      jest.spyOn(authService, 'getGoogleUserInfo').mockResolvedValue({
        accessToken: 'google-token',
        email: 'test@gmail.com',
        name: 'Test User',
      });

      jest
        .spyOn(authService, 'findOrCreateGoogleUser')
        .mockResolvedValue(mockUser as User);

      jest.spyOn(authService, 'login').mockResolvedValue({
        access_token: 'jwt-token',
        user: mockUser,
      });

      await controller.googleAuthCallback({ code: 'google-code' }, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        access_token: 'jwt-token',
        user: mockUser,
      });
    });
  });

  describe('jiraAuthUrl', () => {
    it('should return Jira OAuth URL', async () => {
      const result = await controller.jiraAuthUrl('false');

      expect(result).toContain('auth.atlassian.com/authorize');
      expect(result).toContain('audience=api.atlassian.com');
      expect(result).toContain('response_type=code');
    });
  });

  describe('jiraAuthCallback', () => {
    it('should link Jira account successfully', async () => {
      const mockRequest = {
        user: { id: 1, name: 'Test User' },
      };

      jest.spyOn(authService, 'getJiraToken').mockResolvedValue({
        accessToken: 'jira-access',
        refreshToken: 'jira-refresh',
      });

      jest
        .spyOn(authService, 'getJiraCloudId')
        .mockResolvedValue('cloud-id-123');

      jest
        .spyOn(authService, 'linkJiraAccount')
        .mockResolvedValue({} as Provider);

      const result = await controller.jiraAuthCallback(
        { code: 'jira-code' },
        mockRequest
      );

      expect(result).toEqual({ success: true, user: 'Test User' });
      expect(authService.getJiraToken).toHaveBeenCalledWith('jira-code');
    });

    it('should handle URL-encoded code', async () => {
      const mockRequest = {
        user: { id: 1, name: 'Test User' },
      };

      jest.spyOn(authService, 'getJiraToken').mockResolvedValue({
        accessToken: 'jira-access',
        refreshToken: 'jira-refresh',
      });

      jest
        .spyOn(authService, 'getJiraCloudId')
        .mockResolvedValue('cloud-id-123');

      jest
        .spyOn(authService, 'linkJiraAccount')
        .mockResolvedValue({} as Provider);

      await controller.jiraAuthCallback(
        { code: 'code=encoded%20code&other=param' },
        mockRequest
      );

      expect(authService.getJiraToken).toHaveBeenCalledWith('encoded code');
    });

    it('should throw error when no userId', async () => {
      const mockRequest = {
        user: { id: null, name: 'Test User' },
      };

      await expect(
        controller.jiraAuthCallback({ code: 'jira-code' }, mockRequest)
      ).rejects.toThrow('No session found');
    });
  });
});

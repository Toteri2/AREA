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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

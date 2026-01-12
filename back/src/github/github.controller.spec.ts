import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

describe('GithubController', () => {
  let controller: GithubController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [
        GithubService,
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
          provide: AuthService,
          useValue: {
            getGithubProvider: jest.fn(),
          },
        },
        {
          provide: ReactionsService,
          useValue: {
            executeReaction: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                GITHUB_CLIENT_ID: 'test-github-id',
                GITHUB_CLIENT_SECRET: 'test-github-secret',
              };
              return config[key];
            }),
            getOrThrow: jest.fn((key: string) => {
              const config = {
                GITHUB_CLIENT_ID: 'test-github-id',
                GITHUB_CLIENT_SECRET: 'test-github-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<GithubController>(GithubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

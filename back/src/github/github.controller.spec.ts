import { Test, TestingModule } from '@nestjs/testing';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hook } from '../shared/entities/hook.entity';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';

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
      ],
    }).compile();

    controller = module.get<GithubController>(GithubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

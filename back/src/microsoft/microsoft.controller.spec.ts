import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { MicrosoftController } from './microsoft.controller';
import { MicrosoftService } from './microsoft.service';

describe('MicrosoftController', () => {
  let controller: MicrosoftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MicrosoftController],
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
          },
        },
        {
          provide: AuthService,
          useValue: {
            getMicrosoftToken: jest.fn(),
            generateOAuthState: jest.fn(),
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

    controller = module.get<MicrosoftController>(MicrosoftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

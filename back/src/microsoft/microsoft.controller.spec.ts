import { ConfigService } from '@nestjs/config';
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
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MICROSOFT_CLIENT_ID: 'test-microsoft-id',
                MICROSOFT_CLIENT_SECRET: 'test-microsoft-secret',
              };
              return config[key];
            }),
            getOrThrow: jest.fn((key: string) => {
              const config = {
                MICROSOFT_CLIENT_ID: 'test-microsoft-id',
                MICROSOFT_CLIENT_SECRET: 'test-microsoft-secret',
              };
              return config[key];
            }),
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

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hook } from '../shared/entities/hook.entity';
import { MicrosoftService } from './microsoft.service';

describe('MicrosoftService', () => {
  let service: MicrosoftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
      ],
    }).compile();

    service = module.get<MicrosoftService>(MicrosoftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReactionType } from '../shared/entities/reaction.entity';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

describe('ReactionsController', () => {
  let controller: ReactionsController;
  let reactionsService: ReactionsService;

  const mockReactionsService = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findByHookId: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionsController],
      providers: [
        {
          provide: ReactionsService,
          useValue: mockReactionsService,
        },
      ],
    }).compile();

    controller = module.get<ReactionsController>(ReactionsController);
    reactionsService = module.get<ReactionsService>(ReactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a reaction', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        hookId: 1,
        reactionType: ReactionType.SEND_EMAIL_GMAIL,
        config: { to: 'test@example.com', subject: 'Test' },
      };
      const mockReaction = {
        id: 1,
        userId: 1,
        hookId: 1,
        reactionType: ReactionType.SEND_EMAIL_GMAIL,
        config: mockDto.config,
      };

      mockReactionsService.create.mockResolvedValue(mockReaction);

      const result = await controller.create(mockReq, mockDto);

      expect(reactionsService.create).toHaveBeenCalledWith(
        1,
        1,
        ReactionType.SEND_EMAIL_GMAIL,
        mockDto.config
      );
      expect(result).toEqual(mockReaction);
    });

    it('should handle errors', async () => {
      const mockReq = { user: { id: 1 } };
      const mockDto = {
        hookId: 1,
        reactionType: ReactionType.SEND_EMAIL_GMAIL,
        config: { to: 'test@example.com' },
      };

      mockReactionsService.create.mockRejectedValue(
        new HttpException('Hook not found', 404)
      );

      await expect(controller.create(mockReq, mockDto)).rejects.toThrow(
        HttpException
      );
    });
  });

  describe('findAll', () => {
    it('should return all reactions for a user', async () => {
      const mockReq = { user: { id: 1 } };
      const mockReactions = [
        {
          id: 1,
          userId: 1,
          hookId: 1,
          reactionType: ReactionType.SEND_EMAIL_GMAIL,
        },
        {
          id: 2,
          userId: 1,
          hookId: 2,
          reactionType: ReactionType.DISCORD_SEND_MESSAGE,
        },
      ];

      mockReactionsService.findByUserId.mockResolvedValue(mockReactions);

      const result = await controller.findAll(mockReq);

      expect(reactionsService.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReactions);
    });
  });

  describe('delete', () => {
    it('should delete a reaction', async () => {
      const mockReq = { user: { id: 1 } };
      const reactionId = 1;

      mockReactionsService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockReq, reactionId);

      expect(reactionsService.delete).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ message: 'Reaction deleted successfully' });
    });

    it('should handle errors', async () => {
      const mockReq = { user: { id: 1 } };
      const reactionId = 1;

      mockReactionsService.delete.mockRejectedValue(
        new HttpException('Reaction not found', 404)
      );

      await expect(controller.delete(mockReq, reactionId)).rejects.toThrow(
        HttpException
      );
    });
  });
});

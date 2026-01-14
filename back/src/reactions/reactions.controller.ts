import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ReactionsService } from './reactions.service';

@ApiTags('reactions')
@Controller('reactions')
@UseGuards(AuthGuard('jwt'))
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new reaction attached to a webhook' })
  @ApiResponse({
    status: 201,
    description: 'Reaction created successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hook not found or does not belong to user.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid reaction type or configuration.',
  })
  async create(@Req() req, @Body() dto: CreateReactionDto) {
    try {
      const userId = req.user.id;
      return await this.reactionsService.create(
        userId,
        dto.hookId,
        dto.reactionType,
        dto.config,
        dto.name
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create reaction',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all reactions for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Reactions retrieved successfully.',
  })
  async findAll(@Req() req) {
    try {
      const userId = req.user.id;
      return await this.reactionsService.findByUserId(userId);
    } catch (_error) {
      throw new HttpException(
        'Failed to retrieve reactions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reaction' })
  @ApiResponse({
    status: 200,
    description: 'Reaction deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Reaction not found or does not belong to user.',
  })
  async delete(@Req() req, @Param('id') id: number) {
    try {
      const userId = req.user.id;
      await this.reactionsService.delete(id, userId);
      return { message: 'Reaction deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete reaction',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

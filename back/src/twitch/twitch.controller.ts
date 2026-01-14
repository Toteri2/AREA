import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { RequireProvider } from '../auth/guards/provider.guard';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { ProviderType } from '../shared/enums/provider.enum';
import { CreateTwitchWebhookDto } from './dto/twitch.dto';
import { TwitchService } from './twitch.service';

@ApiTags('twitch')
@Controller('twitch')
export class TwitchController {
  constructor(
    private readonly twitchService: TwitchService,
    private readonly reactionsService: ReactionsService,
    private readonly configService: ConfigService,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current Twitch user information' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Twitch account not linked.',
  })
  @UseGuards(AuthGuard('jwt'))
  @RequireProvider(ProviderType.TWITCH)
  async getCurrentUser(@Req() req) {
    try {
      return await this.twitchService.getCurrentUser(req.provider.accessToken);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Failed to get Twitch user:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve user information'
      );
    }
  }

  @Get('followed-channels')
  @ApiOperation({ summary: 'Get user followed channels' })
  @ApiResponse({
    status: 200,
    description: 'Followed channels retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Twitch account not linked.',
  })
  @UseGuards(AuthGuard('jwt'))
  @RequireProvider(ProviderType.TWITCH)
  async getFollowedChannels(@Req() req) {
    try {
      const userData = await this.twitchService.getCurrentUser(
        req.provider.accessToken
      );
      const userIdTwitch = userData.data[0].id;
      return await this.twitchService.getFollowedChannels(
        req.provider.accessToken,
        userIdTwitch
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Failed to get followed channels:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve followed channels'
      );
    }
  }

  @Get('webhook')
  @ApiOperation({ summary: 'List all webhooks for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  @RequireProvider(ProviderType.TWITCH)
  async getAllWebhooks(@Req() req) {
    const userId = req.user.id;

    const hooks = await this.hooksRepository.find({
      where: { userId: userId, service: 'twitch' },
    });

    return hooks;
  }

  @Get('webhook/:hookId')
  @ApiOperation({ summary: 'Get details of a specific webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook details retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  @RequireProvider(ProviderType.TWITCH)
  async getWebhookDetails(@Req() req, @Param('hookId') hookId: number) {
    const userId = req.user.id;

    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: userId, service: 'twitch' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    return hook;
  }

  @Post('create-webhook')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Twitch EventSub webhook' })
  @ApiResponse({
    status: 201,
    description: 'Webhook subscription created successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  @RequireProvider(ProviderType.TWITCH)
  async createWebhook(
    @Req() req,
    @Body() createWebhookDto: CreateTwitchWebhookDto
  ) {
    const userId = req.user.id;
    const webhookUrl = this.configService.getOrThrow<string>(
      'TWITCH_WEBHOOK_CALLBACK_URL'
    );
    const result = await this.twitchService.createWebhook(
      createWebhookDto,
      webhookUrl
    );

    const broadcasterData = await this.twitchService.getBroadcasterName(
      req.provider.accessToken,
      createWebhookDto.broadcasterUserId
    );

    const hook = this.hooksRepository.create({
      userId: userId,
      webhookId: result.data[0].id,
      service: 'twitch',
      additionalInfos: {
        broadcasterUserId: createWebhookDto.broadcasterUserId,
        broadcasterName: broadcasterData.display_name,
        broadcasterLogin: broadcasterData.login,
        events: [createWebhookDto.eventType],
      },
    });

    const savedHook = await this.hooksRepository.save(hook);
    return { result, hookId: savedHook.id };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Twitch EventSub webhook callback' })
  @ApiResponse({
    status: 200,
    description: 'Webhook callback handled successfully.',
  })
  async webhook(
    @Headers('twitch-eventsub-message-id') messageId: string,
    @Headers('twitch-eventsub-message-timestamp') timestamp: string,
    @Headers('twitch-eventsub-message-signature') signature: string,
    @Headers('twitch-eventsub-message-type') messageType: string,
    @Headers('twitch-eventsub-subscription-type') subscriptionType: string,
    @Body() body: any,
    @Res() res
  ) {
    const bodyString = JSON.stringify(body);
    if (messageType.localeCompare('webhook_callback_verification') === 0) {
      return res
        .set('Content-Type', 'text/plain')
        .status(HttpStatus.OK)
        .send(body.challenge);
    }
    const isValid = this.twitchService.verifyWebhookSignature(
      messageId,
      timestamp,
      bodyString,
      signature
    );

    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    if (messageType === 'notification') {
      if (body.subscription) {
        const subscriptionId = body.subscription.id;
        const hooks = await this.hooksRepository.find({
          where: { webhookId: subscriptionId, service: 'twitch' },
        });

        for (const hook of hooks) {
          const reactions = await this.reactionsService.findByHookId(hook.id);

          for (const reaction of reactions) {
            try {
              await this.reactionsService.executeReaction(
                reaction,
                body,
                hook.userId
              );
            } catch (error) {
              console.error(
                `Failed to execute reaction ${reaction.id}:`,
                error
              );
            }
          }
        }
      }

      return res.status(HttpStatus.OK).send({ status: 'ok' });
    }

    if (messageType === 'revocation') {
      return res.status(HttpStatus.OK).send({ status: 'ok' });
    }

    return res.status(HttpStatus.OK).send({ status: 'ok' });
  }

  @Delete('webhook/:hookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a Twitch webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  @RequireProvider(ProviderType.TWITCH)
  async deleteWebhook(@Req() req, @Param('hookId') hookId: number) {
    const userId = req.user.id;
    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: userId, service: 'twitch' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    await this.twitchService.deleteWebhook(hook.webhookId);
    await this.hooksRepository.delete({ id: hookId, service: 'twitch' });

    return { message: 'Webhook deleted successfully' };
  }
}

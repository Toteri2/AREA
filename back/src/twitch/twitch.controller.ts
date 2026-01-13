import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { CreateTwitchWebhookDto } from './dto/twitch.dto';
import { TwitchService } from './twitch.service';

@ApiTags('twitch')
@Controller('twitch')
export class TwitchController {
  constructor(
    private readonly twitchService: TwitchService,
    private readonly authService: AuthService,
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
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Req() req) {
    const provider = await this.authService.getTwitchProvider(req.user.id);
    if (!provider) throw new UnauthorizedException('Twitch account not linked');
    return this.twitchService.getCurrentUser(provider.accessToken);
  }

  @Get('followed-channels')
  @ApiOperation({ summary: 'Get user followed channels' })
  @ApiResponse({
    status: 200,
    description: 'Followed channels retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getFollowedChannels(@Req() req) {
    const provider = await this.authService.getTwitchProvider(req.user.id);
    if (!provider) throw new UnauthorizedException('Twitch account not linked');

    const userData = await this.twitchService.getCurrentUser(
      provider.accessToken
    );
    const userId = userData.data[0].id;

    return this.twitchService.getFollowedChannels(provider.accessToken, userId);
  }

  @Get('webhook')
  @ApiOperation({ summary: 'List all webhooks for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getAllWebhooks(@Req() req) {
    const provider = await this.authService.getTwitchProvider(req.user.id);
    if (!provider) throw new UnauthorizedException('Twitch account not linked');

    const hooks = await this.hooksRepository.find({
      where: { userId: req.user.id, service: 'twitch' },
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
  async getWebhookDetails(@Req() req, @Param('hookId') hookId: number) {
    const provider = await this.authService.getTwitchProvider(req.user.id);
    if (!provider) throw new UnauthorizedException('Twitch account not linked');

    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: req.user.id, service: 'twitch' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    return hook;
  }

  @Post('create-webhook')
  @ApiOperation({ summary: 'Create a Twitch EventSub webhook' })
  @ApiResponse({
    status: 201,
    description: 'Webhook subscription created successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(
    @Req() req,
    @Body() createWebhookDto: CreateTwitchWebhookDto
  ) {
    const provider = await this.authService.getTwitchProvider(req.user.id);
    if (!provider) throw new UnauthorizedException('Twitch account not linked');

    const webhookUrl = this.configService.getOrThrow<string>(
      'TWITCH_WEBHOOK_CALLBACK_URL'
    );
    const result = await this.twitchService.createWebhook(
      createWebhookDto,
      webhookUrl
    );

    const broadcasterData = await this.twitchService.getBroadcasterName(
      provider.accessToken,
      createWebhookDto.broadcasterUserId
    );

    const hook = this.hooksRepository.create({
      userId: req.user.id,
      webhookId: result.data[0].id,
      service: 'twitch',
      additionalInfos: {
        broadcasterUserId: createWebhookDto.broadcasterUserId,
        broadcasterName: broadcasterData.display_name,
        broadcasterLogin: broadcasterData.login,
      },
    });

    const savedHook = await this.hooksRepository.save(hook);
    return { result, hookId: savedHook.id };
  }

  @Post('webhook')
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
        .status(200)
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

      return res.status(200).send({ status: 'ok' });
    }

    if (messageType === 'revocation') {
      return res.status(200).send({ status: 'ok' });
    }

    return res.status(200).send({ status: 'ok' });
  }

  @Delete('webhook/:hookId')
  @ApiOperation({ summary: 'Delete a Twitch webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteWebhook(@Req() req, @Param('hookId') hookId: number) {
    const provider = await this.authService.getTwitchProvider(req.user.id);
    if (!provider) throw new UnauthorizedException('Twitch account not linked');

    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: req.user.id, service: 'twitch' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    await this.twitchService.deleteWebhook(hook.webhookId);
    await this.hooksRepository.delete({ id: hookId, service: 'twitch' });

    return { message: 'Webhook deleted successfully' };
  }
}

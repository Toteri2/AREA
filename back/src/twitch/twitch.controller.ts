import {
    Body,
    Controller,
    Get,
    Headers,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { CreateTwitchWebhookDto } from './dto/twitch-webhook.dto';
import { TwitchService } from './twitch.service';

@ApiTags('twitch')
@Controller('twitch')
export class TwitchController {
    constructor(
        private readonly twitchService: TwitchService,
        private readonly authService: AuthService,
        private readonly reactionsService: ReactionsService,
        @InjectRepository(Hook)
        private hooksRepository: Repository<Hook>,
    ) { }

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

        const userData = await this.twitchService.getCurrentUser(provider.accessToken);
        const userId = userData.data[0].id;

        return this.twitchService.getFollowedChannels(provider.accessToken, userId);
    }

    @Get('metadata')
    @ApiOperation({
        summary: 'Get Twitch service metadata (actions and reactions)',
    })
    @ApiResponse({
        status: 200,
        description: 'Service metadata retrieved successfully.',
    })
    async getMetadata() {
        return this.twitchService.getServiceMetadata();
    }

    @Post('create-webhook')
    @ApiOperation({ summary: 'Create a Twitch EventSub webhook' })
    @ApiResponse({
        status: 201,
        description: 'Webhook subscription created successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async createWebhook(@Req() req, @Body() createWebhookDto: CreateTwitchWebhookDto) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');

        const webhookUrl = process.env.TWITCH_WEBHOOK_CALLBACK_URL || '';
        const result = await this.twitchService.createWebhook(
            provider.accessToken,
            createWebhookDto,
            webhookUrl
        );

        const hook = this.hooksRepository.create({
            userId: req.user.id,
            webhookId: result.data[0].id,
            service: 'twitch',
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
    ) {
        const bodyString = JSON.stringify(body);
        const isValid = this.twitchService.verifyWebhookSignature(
            messageId,
            timestamp,
            bodyString,
            signature,
        );

        if (!isValid) {
            throw new BadRequestException('Invalid signature');
        }

        if (messageType === 'webhook_callback_verification') {
            return { challenge: body.challenge };
        }

        if (messageType === 'notification') {
            console.log('Twitch webhook received:', subscriptionType);
            console.log('Payload:', body);

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
                            console.error(`Failed to execute reaction ${reaction.id}:`, error);
                        }
                    }
                }
            }

            return { status: 'ok' };
        }

        if (messageType === 'revocation') {
            console.log('Subscription revoked:', body.subscription);
            return { status: 'ok' };
        }

        return { status: 'ok' };
    }
}

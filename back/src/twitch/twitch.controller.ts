import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { CreateClipDto, UpdateStreamDto } from './dto/twitch.dto';
import { CreateTwitchWebhookDto, EventSubCallbackDto } from './dto/twitch-webhook.dto';
import { TwitchService } from './twitch.service';

@ApiTags('twitch')
@Controller('twitch')
export class TwitchController {
    constructor(
        private readonly twitchService: TwitchService,
        private readonly authService: AuthService
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

    @Get('followed-streams')
    @ApiOperation({ summary: 'Get live streams from followed channels' })
    @ApiResponse({
        status: 200,
        description: 'Followed streams retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async getFollowedStreams(@Req() req) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');

        const userData = await this.twitchService.getCurrentUser(provider.accessToken);
        const userId = userData.data[0].id;

        return this.twitchService.getFollowedStreams(provider.accessToken, userId);
    }

    @Get('channels/:broadcasterId')
    @ApiOperation({ summary: 'Get channel information' })
    @ApiResponse({
        status: 200,
        description: 'Channel information retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async getChannelInfo(@Req() req, @Param('broadcasterId') broadcasterId: string) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.getChannelInfo(provider.accessToken, broadcasterId);
    }

    @Get('streams/:userId')
    @ApiOperation({ summary: 'Get stream information for a user' })
    @ApiResponse({
        status: 200,
        description: 'Stream information retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async getStreamInfo(@Req() req, @Param('userId') userId: string) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.getStreamInfo(provider.accessToken, userId);
    }

    @Get('videos/:userId')
    @ApiOperation({ summary: 'Get channel videos' })
    @ApiResponse({
        status: 200,
        description: 'Videos retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async getVideos(@Req() req, @Param('userId') userId: string) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.getVideos(provider.accessToken, userId);
    }

    @Get('clips/:broadcasterId')
    @ApiOperation({ summary: 'Get channel clips' })
    @ApiResponse({
        status: 200,
        description: 'Clips retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async getClips(@Req() req, @Param('broadcasterId') broadcasterId: string) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.getClips(provider.accessToken, broadcasterId);
    }

    @Post('clips')
    @ApiOperation({ summary: 'Create a clip from a live stream' })
    @ApiResponse({
        status: 201,
        description: 'Clip created successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async createClip(@Req() req, @Body() createClipDto: CreateClipDto) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.createClip(provider.accessToken, createClipDto);
    }

    @Patch('streams/:broadcasterId')
    @ApiOperation({ summary: 'Update stream information' })
    @ApiResponse({
        status: 200,
        description: 'Stream information updated successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async updateStreamInfo(
        @Req() req,
        @Param('broadcasterId') broadcasterId: string,
        @Body() updateStreamDto: UpdateStreamDto
    ) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.updateStreamInfo(
            provider.accessToken,
            broadcasterId,
            updateStreamDto
        );
    }

    @Get('games/top')
    @ApiOperation({ summary: 'Get top games/categories' })
    @ApiResponse({
        status: 200,
        description: 'Top games retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async getTopGames(@Req() req) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.getTopGames(provider.accessToken);
    }

    @Get('search/channels')
    @ApiOperation({ summary: 'Search for channels' })
    @ApiResponse({
        status: 200,
        description: 'Channels found successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async searchChannels(@Req() req, @Query('query') query: string) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.searchChannels(provider.accessToken, query);
    }

    @Get('subscriptions/:broadcasterId')
    @ApiOperation({ summary: 'Get channel subscriptions' })
    @ApiResponse({
        status: 200,
        description: 'Subscriptions retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async getSubscriptions(@Req() req, @Param('broadcasterId') broadcasterId: string) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');
        return this.twitchService.getSubscriptions(provider.accessToken, broadcasterId);
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
        return this.twitchService.getMetadata();
    }

    @Post('webhooks/subscribe')
    @ApiOperation({ summary: 'Subscribe to Twitch EventSub webhook' })
    @ApiResponse({
        status: 201,
        description: 'Webhook subscription created successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async subscribeToWebhook(@Req() req, @Body() dto: CreateTwitchWebhookDto) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');

        const callbackUrl = process.env.TWITCH_WEBHOOK_CALLBACK_URL || 'https://your-domain.com/twitch/webhooks/callback';

        return this.twitchService.subscribeToEventSub(
            req.user.id,
            provider.accessToken,
            dto.eventType,
            dto.condition,
            callbackUrl,
        );
    }

    @Delete('webhooks/:subscriptionId')
    @ApiOperation({ summary: 'Unsubscribe from Twitch EventSub webhook' })
    @ApiResponse({
        status: 200,
        description: 'Webhook unsubscribed successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async unsubscribeFromWebhook(@Req() req, @Param('subscriptionId') subscriptionId: string) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');

        return this.twitchService.unsubscribeFromEventSub(provider.accessToken, subscriptionId);
    }

    @Get('webhooks')
    @ApiOperation({ summary: 'List all EventSub subscriptions' })
    @ApiResponse({
        status: 200,
        description: 'EventSub subscriptions retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async listWebhooks(@Req() req) {
        const provider = await this.authService.getTwitchProvider(req.user.id);
        if (!provider) throw new UnauthorizedException('Twitch account not linked');

        return this.twitchService.listEventSubSubscriptions(provider.accessToken);
    }

    @Get('webhooks/user')
    @ApiOperation({ summary: 'Get user active webhooks from database' })
    @ApiResponse({
        status: 200,
        description: 'User webhooks retrieved successfully.',
    })
    @UseGuards(AuthGuard('jwt'))
    async getUserWebhooks(@Req() req) {
        return this.twitchService.getUserWebhooks(req.user.id);
    }

    @Post('webhooks/callback')
    @ApiOperation({ summary: 'Twitch EventSub webhook callback' })
    @ApiResponse({
        status: 200,
        description: 'Webhook callback handled successfully.',
    })
    async handleWebhookCallback(
        @Headers('twitch-eventsub-message-id') messageId: string,
        @Headers('twitch-eventsub-message-timestamp') timestamp: string,
        @Headers('twitch-eventsub-message-signature') signature: string,
        @Headers('twitch-eventsub-message-type') messageType: string,
        @Body() body: EventSubCallbackDto,
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
            console.log('Received Twitch event:', body.subscription?.type);
            console.log('Event data:', body.event);

            return { status: 'ok' };
        }

        if (messageType === 'revocation') {
            console.log('Subscription revoked:', body.subscription);
            return { status: 'ok' };
        }

        return { status: 'ok' };
    }
}

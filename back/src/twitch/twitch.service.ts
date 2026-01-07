import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClipDto, SendChatMessageDto, UpdateStreamDto } from './dto/twitch.dto';
import { TwitchWebhook } from '../shared/entities/twitch-webhook.entity';
import * as crypto from 'crypto';

@Injectable()
export class TwitchService {
    private readonly baseUrl = 'https://api.twitch.tv/helix';
    private readonly webhookSecret: string;

    constructor(
        private configService: ConfigService,
        @InjectRepository(TwitchWebhook)
        private webhookRepository: Repository<TwitchWebhook>,
    ) {
        this.webhookSecret = this.configService.get<string>('TWITCH_WEBHOOK_SECRET') || 'your_webhook_secret';
    }

    /**
     * Get current authenticated Twitch user info
     */
    async getCurrentUser(userAccessToken: string) {
        const response = await fetch(`${this.baseUrl}/users`, {
            headers: this.getHeaders(userAccessToken),
        });
        return this.handleResponse(response);
    }

    /**
     * Get user's followed channels
     */
    async getFollowedChannels(userAccessToken: string, userId: string) {
        const response = await fetch(
            `${this.baseUrl}/channels/followed?user_id=${userId}`,
            {
                headers: this.getHeaders(userAccessToken),
            }
        );
        return this.handleResponse(response);
    }

    /**
     * Get streams for followed channels
     */
    async getFollowedStreams(userAccessToken: string, userId: string) {
        const response = await fetch(
            `${this.baseUrl}/streams/followed?user_id=${userId}`,
            {
                headers: this.getHeaders(userAccessToken),
            }
        );
        return this.handleResponse(response);
    }

    /**
     * Get channel information
     */
    async getChannelInfo(userAccessToken: string, broadcasterId: string) {
        const response = await fetch(
            `${this.baseUrl}/channels?broadcaster_id=${broadcasterId}`,
            {
                headers: this.getHeaders(userAccessToken),
            }
        );
        return this.handleResponse(response);
    }

    /**
     * Get stream information
     */
    async getStreamInfo(userAccessToken: string, userId: string) {
        const response = await fetch(`${this.baseUrl}/streams?user_id=${userId}`, {
            headers: this.getHeaders(userAccessToken),
        });
        return this.handleResponse(response);
    }

    /**
     * Get channel's videos
     */
    async getVideos(userAccessToken: string, userId: string) {
        const response = await fetch(
            `${this.baseUrl}/videos?user_id=${userId}&first=20`,
            {
                headers: this.getHeaders(userAccessToken),
            }
        );
        return this.handleResponse(response);
    }

    /**
     * Get channel's clips
     */
    async getClips(userAccessToken: string, broadcasterId: string) {
        const response = await fetch(
            `${this.baseUrl}/clips?broadcaster_id=${broadcasterId}&first=20`,
            {
                headers: this.getHeaders(userAccessToken),
            }
        );
        return this.handleResponse(response);
    }

    /**
     * Create a clip from a live stream
     */
    async createClip(userAccessToken: string, dto: CreateClipDto) {
        const { broadcasterId } = dto;

        const response = await fetch(
            `${this.baseUrl}/clips?broadcaster_id=${broadcasterId}`,
            {
                method: 'POST',
                headers: this.getHeaders(userAccessToken),
            }
        );
        return this.handleResponse(response);
    }

    /**
     * Update stream information
     */
    async updateStreamInfo(
        userAccessToken: string,
        broadcasterId: string,
        dto: UpdateStreamDto
    ) {
        const response = await fetch(
            `${this.baseUrl}/channels?broadcaster_id=${broadcasterId}`,
            {
                method: 'PATCH',
                headers: {
                    ...this.getHeaders(userAccessToken),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...(dto.title && { title: dto.title }),
                    ...(dto.gameId && { game_id: dto.gameId }),
                    ...(dto.broadcasterLanguage && {
                        broadcaster_language: dto.broadcasterLanguage,
                    }),
                }),
            }
        );

        if (response.status === 204) {
            return { success: true, message: 'Stream info updated successfully' };
        }
        return this.handleResponse(response);
    }

    /**
     * Get top games/categories
     */
    async getTopGames(userAccessToken: string) {
        const response = await fetch(`${this.baseUrl}/games/top?first=20`, {
            headers: this.getHeaders(userAccessToken),
        });
        return this.handleResponse(response);
    }

    /**
     * Search channels
     */
    async searchChannels(userAccessToken: string, query: string) {
        const response = await fetch(
            `${this.baseUrl}/search/channels?query=${encodeURIComponent(query)}&first=20`,
            {
                headers: this.getHeaders(userAccessToken),
            }
        );
        return this.handleResponse(response);
    }

    /**
     * Get user's subscriptions
     */
    async getSubscriptions(userAccessToken: string, broadcasterId: string) {
        const response = await fetch(
            `${this.baseUrl}/subscriptions?broadcaster_id=${broadcasterId}`,
            {
                headers: this.getHeaders(userAccessToken),
            }
        );
        return this.handleResponse(response);
    }

    /**
     * Get metadata for Twitch service
     */
    getMetadata() {
        return {
            name: 'Twitch',
            actions: [
                {
                    name: 'stream_started',
                    description: 'Triggered when a followed channel goes live',
                },
                {
                    name: 'stream_ended',
                    description: 'Triggered when a stream ends',
                },
                {
                    name: 'new_follower',
                    description: 'Triggered when someone follows your channel',
                },
                {
                    name: 'new_subscriber',
                    description: 'Triggered when someone subscribes to your channel',
                },
                {
                    name: 'viewer_threshold',
                    description: 'Triggered when stream reaches a viewer count threshold',
                },
            ],
            reactions: [
                {
                    name: 'create_clip',
                    description: 'Create a clip from a live stream',
                },
                {
                    name: 'update_stream_info',
                    description: 'Update stream title or category',
                },
                {
                    name: 'send_chat_message',
                    description: 'Send a message in chat (requires chatbot)',
                },
            ],
        };
    }

    private getHeaders(accessToken: string) {
        const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
        return {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': clientId || '',
            'Content-Type': 'application/json',
        };
    }

    /**
     * Get App Access Token (Client Credentials)
     * Required for EventSub webhooks
     */
    private async getAppAccessToken(): Promise<string> {
        const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
        const clientSecret = this.configService.get<string>('TWITCH_CLIENT_SECRET');

        const params = new URLSearchParams();
        params.append('client_id', clientId || '');
        params.append('client_secret', clientSecret || '');
        params.append('grant_type', 'client_credentials');

        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            body: params,
        });

        if (!response.ok) {
            throw new HttpException('Failed to get app access token', response.status);
        }

        const data = await response.json();
        return data.access_token;
    }

    private async handleResponse(response: Response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new HttpException(
                error.message || 'Twitch request failed',
                response.status
            );
        }
        if (response.status === 204) {
            return null;
        }
        return response.json();
    }

    /**
     * Subscribe to EventSub webhook
     */
    async subscribeToEventSub(
        userId: number,
        userAccessToken: string,
        eventType: string,
        condition: any,
        callbackUrl: string,
    ) {
        const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
        const appAccessToken = await this.getAppAccessToken();

        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appAccessToken}`,
                'Client-Id': clientId || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: eventType,
                version: '1',
                condition,
                transport: {
                    method: 'webhook',
                    callback: callbackUrl,
                    secret: this.webhookSecret,
                },
            }),
        });

        const data = await this.handleResponse(response);

        const webhook = this.webhookRepository.create({
            userId,
            subscriptionId: data.data[0].id,
            eventType,
            condition,
            status: 'enabled',
            callbackUrl,
        });

        await this.webhookRepository.save(webhook);

        return data;
    }

    /**
     * Unsubscribe from EventSub webhook
     */
    async unsubscribeFromEventSub(userAccessToken: string, subscriptionId: string) {
        const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
        const appAccessToken = await this.getAppAccessToken();

        const response = await fetch(
            `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${appAccessToken}`,
                    'Client-Id': clientId || '',
                },
            }
        );

        if (response.status !== 204) {
            throw new HttpException('Failed to unsubscribe', response.status);
        }

        // Update webhook status in database
        await this.webhookRepository.update(
            { subscriptionId },
            { status: 'disabled' }
        );

        return { success: true };
    }

    /**
     * List all EventSub subscriptions
     */
    async listEventSubSubscriptions(userAccessToken: string) {
        const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
        const appAccessToken = await this.getAppAccessToken();

        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                'Authorization': `Bearer ${appAccessToken}`,
                'Client-Id': clientId || '',
            },
        });

        return this.handleResponse(response);
    }

    /**
     * Verify webhook signature from Twitch
     */
    verifyWebhookSignature(messageId: string, timestamp: string, body: string, signature: string): boolean {
        const message = messageId + timestamp + body;
        const hmac = crypto.createHmac('sha256', this.webhookSecret);
        hmac.update(message);
        const expectedSignature = 'sha256=' + hmac.digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    /**
     * Get user's active webhooks
     */
    async getUserWebhooks(userId: number) {
        return this.webhookRepository.find({
            where: { userId, status: 'enabled' },
        });
    }
}

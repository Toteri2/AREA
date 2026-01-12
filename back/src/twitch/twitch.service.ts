import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTwitchWebhookDto } from './dto/twitch-webhook.dto';
import * as crypto from 'crypto';

@Injectable()
export class TwitchService {
    private readonly baseUrl = 'https://api.twitch.tv/helix';
    private readonly webhookSecret: string;

    constructor(private configService: ConfigService) {
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
     * Create a Twitch EventSub webhook
     */
    async createWebhook(
        userAccessToken: string,
        dto: CreateTwitchWebhookDto,
        webhookUrl: string
    ) {
        const { broadcasterUserId, eventType, secret } = dto;
        const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
        const appAccessToken = await this.getAppAccessToken();

        const condition = this.buildCondition(eventType, broadcasterUserId);
        const version = eventType === 'channel.follow' ? '2' : '1';

        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appAccessToken}`,
                'Client-Id': clientId || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: eventType,
                version,
                condition,
                transport: {
                    method: 'webhook',
                    callback: webhookUrl,
                    secret: secret || this.webhookSecret,
                },
            }),
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
     * Get service metadata for actions and reactions
     */
    getServiceMetadata() {
        return {
            name: 'twitch',
            actions: [
                {
                    name: 'stream.online',
                    description: 'Triggered when a channel goes live',
                    parameters: [
                        {
                            name: 'broadcasterUserId',
                            type: 'string',
                            description: 'The ID of the broadcaster to monitor',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'stream.offline',
                    description: 'Triggered when a stream ends',
                    parameters: [
                        {
                            name: 'broadcasterUserId',
                            type: 'string',
                            description: 'The ID of the broadcaster to monitor',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'channel.update',
                    description: 'Triggered when channel information is updated',
                    parameters: [
                        {
                            name: 'broadcasterUserId',
                            type: 'string',
                            description: 'The ID of the broadcaster to monitor',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'channel.follow',
                    description: 'Triggered when someone follows a channel',
                    parameters: [
                        {
                            name: 'broadcasterUserId',
                            type: 'string',
                            description: 'The ID of the broadcaster to monitor',
                            required: true,
                        },
                    ],
                },
            ],
            reactions: [
                {
                    name: 'send_chat_message',
                    description: 'Send a message in chat',
                },
                {
                    name: 'update_stream_info',
                    description: 'Update stream title or category',
                },
            ],
        };
    }

    /**
     * Build condition object based on event type
     */
    private buildCondition(eventType: string, broadcasterUserId: string): any {
        const baseCondition = { broadcaster_user_id: broadcasterUserId };

        if (eventType === 'channel.follow') {
            return {
                ...baseCondition,
                moderator_user_id: broadcasterUserId,
            };
        }

        return baseCondition;
    }

    /**
     * Get App Access Token (Client Credentials)
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

    private getHeaders(accessToken: string) {
        const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
        return {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': clientId || '',
            'Content-Type': 'application/json',
        };
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
}

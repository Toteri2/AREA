import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { CreateTwitchWebhookDto } from './dto/twitch.dto';

@Injectable()
export class TwitchService {
  private readonly baseUrl = 'https://api.twitch.tv/helix';
  private readonly webhookSecret: string;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // 100ms between API calls to Twitch

  constructor(private configService: ConfigService) {
    this.webhookSecret = this.configService.getOrThrow<string>(
      'TWITCH_WEBHOOK_SECRET'
    );
  }

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  async getCurrentUser(userAccessToken: string) {
    await this.rateLimit();
    const response = await axios.get(`${this.baseUrl}/users`, {
      headers: this.getHeaders(userAccessToken),
    });
    return this.handleResponse(response);
  }

  async getFollowedChannels(userAccessToken: string, userId: string) {
    await this.rateLimit();
    const response = await axios.get(
      `${this.baseUrl}/channels/followed?user_id=${userId}`,
      {
        headers: this.getHeaders(userAccessToken),
      }
    );
    return this.handleResponse(response);
  }

  async getBroadcasterName(userAccessToken: string, broadcasterId: string) {
    const response = await axios.get(
      `${this.baseUrl}/users?id=${broadcasterId}`,
      {
        headers: this.getHeaders(userAccessToken),
      }
    );
    const data = await this.handleResponse(response);
    return data.data[0];
  }

  async createWebhook(dto: CreateTwitchWebhookDto, webhookUrl: string) {
    await this.rateLimit();
    const { broadcasterUserId, eventType, secret } = dto;
    const clientId = this.configService.getOrThrow<string>('TWITCH_CLIENT_ID');
    const appAccessToken = await this.getAppAccessToken();

    const condition = this.buildCondition(eventType, broadcasterUserId);
    const version = eventType === 'channel.follow' ? '2' : '1';

    const response = await axios.post(
      'https://api.twitch.tv/helix/eventsub/subscriptions',
      {
        type: eventType,
        version,
        condition,
        transport: {
          method: 'webhook',
          callback: webhookUrl,
          secret: secret || this.webhookSecret,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${appAccessToken}`,
          'Client-Id': clientId,
          'Content-Type': 'application/json',
        },
      }
    );

    return this.handleResponse(response);
  }

  async deleteWebhook(subscriptionId: string) {
    await this.rateLimit();
    const clientId = this.configService.getOrThrow<string>('TWITCH_CLIENT_ID');
    const appAccessToken = await this.getAppAccessToken();

    const response = await axios.delete(
      `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${appAccessToken}`,
          'Client-Id': clientId,
        },
      }
    );

    return this.handleResponse(response);
  }

  verifyWebhookSignature(
    messageId: string,
    timestamp: string,
    body: string,
    signature: string
  ): boolean {
    const message = messageId + timestamp + body;
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(message);
    const expectedSignature = 'sha256=' + hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

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

  private async getAppAccessToken(): Promise<string> {
    const clientId = this.configService.getOrThrow<string>('TWITCH_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>(
      'TWITCH_CLIENT_SECRET'
    );

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  }

  private getHeaders(accessToken: string) {
    const clientId = this.configService.getOrThrow<string>('TWITCH_CLIENT_ID');
    return {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': clientId,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: any) {
    if (response.status === 204) {
      return null;
    }
    return response.data;
  }
}

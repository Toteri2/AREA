import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);
  private readonly baseUrl = 'https://discord.com/api/v10';
  private readonly botToken: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('DISCORD_BOT_TOKEN') || '';
  }

  async createWebhook(channelId: string, webhookUrl: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels/${channelId}/webhooks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${this.botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'AREA Webhook',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Discord API error: ${JSON.stringify(error)}`);
      }

      const webhook = await response.json();
      this.logger.log(
        `Webhook created for channel ${channelId}: ${webhook.id}`
      );

      return webhook;
    } catch (error) {
      this.logger.error(
        `Failed to create webhook for channel ${channelId}:`,
        error
      );
      throw error;
    }
  }

  async deleteWebhook(webhookId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${this.botToken}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        const error = await response.json();
        throw new Error(`Discord API error: ${JSON.stringify(error)}`);
      }

      this.logger.log(`Webhook ${webhookId} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete webhook ${webhookId}:`, error);
      throw error;
    }
  }

  async listChannelWebhooks(channelId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels/${channelId}/webhooks`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Discord API error: ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(
        `Failed to list webhooks for channel ${channelId}:`,
        error
      );
      throw error;
    }
  }

  async handleWebhookEvent(payload: any) {
    this.logger.debug('Received webhook event:', payload);

    return { received: true };
  }

  verifyWebhookSignature(
    signature: string,
    timestamp: string,
    body: string
  ): boolean {
    this.logger.warn(
      'Webhook signature verification not implemented - accepting all requests'
    );
    return true;
  }
}

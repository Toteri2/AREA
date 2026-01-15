import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from 'discord.js';

@Injectable()
export class DiscordBotService implements OnModuleInit {
  private readonly logger = new Logger(DiscordBotService.name);
  private client: Client;
  private isReady = false;
  private webhookUrl: string;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.webhookUrl = this.configService.getOrThrow<string>('DISCORD_WEBHOOK_URL');
  }

  async onModuleInit() {
    await this.initializeBot();
  }

  private async initializeBot() {
    const botToken = this.configService.getOrThrow<string>('DISCORD_BOT_TOKEN');

    if (!botToken) {
      this.logger.warn('DISCORD_BOT_TOKEN not configured. Bot will not start.');
      return;
    }

    try {
      this.setupEventHandlers();
      await this.client.login(botToken);
      this.logger.log('Discord bot logged in successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Discord bot:', error);
    }
  }

  private setupEventHandlers() {
    this.client.on(Events.ClientReady, async () => {
      this.isReady = true;
      this.logger.log(`Discord bot is ready! Logged in as ${this.client.user?.tag}`);
      this.logger.log(`Webhook URL configured: ${this.webhookUrl}`);
    });
    this.client.on(Events.MessageCreate, async (message: Message) => {
      await this.handleMessageCreate(message);
    });
    this.client.on(
      Events.MessageReactionAdd,
      async (
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser
      ) => {
        await this.handleReactionAdd(reaction, user);
      }
    );
    this.client.on(Events.Error, (error) => {
      this.logger.error('Discord client error:', error);
    });
  }

  private async handleMessageCreate(message: Message) {
    if (message.author.bot) return;

    try {
      await this.sendToWebhook({
        triggerType: 'new_message_in_channel',
        channelId: message.channel.id,
        messageId: message.id,
        content: message.content,
        authorId: message.author.id,
        authorTag: message.author.tag,
        timestamp: message.createdAt,
      });
    } catch (error) {
      this.logger.error('Error handling message create:', error);
    }
  }

  private async handleReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    if (user.bot) return;

    try {
      if (reaction.partial) {
        await reaction.fetch();
      }
      if (user.partial) {
        await user.fetch();
      }
      await this.sendToWebhook({
        triggerType: 'reaction_added',
        channelId: reaction.message.channel.id,
        messageId: reaction.message.id,
        emoji: reaction.emoji.name,
        userId: user.id,
        userTag: (user as User).tag,
        count: reaction.count,
      });
    } catch (error) {
      this.logger.error('Error handling reaction add:', error);
    }
  }

  private async sendToWebhook(eventData: any) {
    try {
      const webhookPayload = {
        type: 2,
        service: 'discord',
        data: eventData,
        timestamp: new Date().toISOString(),
      };
      await axios.post(this.webhookUrl, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    } catch (error) {
      this.logger.error(
        `Error sending event to webhook:`,
        error.message
      );
    }
  }
  public isClientReady(): boolean {
    return this.isReady;
  }
  public getClient(): Client {
    return this.client;
  }
}

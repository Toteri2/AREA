import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { handleAxiosError } from '../shared/utils/axios.handler';
import {
  AddRoleDto,
  CreatePrivateChannelDto,
  SendMessageDto,
} from './dto/discord.dto';

@Injectable()
export class DiscordService {
  private readonly baseUrl = 'https://discord.com/api/v10';
  private readonly botToken: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('DISCORD_BOT_TOKEN') || '';
    if (!this.botToken) {
      console.warn('DISCORD_BOT_TOKEN is not set in environment variables');
    }
  }

  async getChannelMessages(userAccessToken: string, channelId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/channels/${channelId}/messages?limit=10`,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to get channel messages');
    }
  }

  async getGuildMembers(userAccessToken: string, guildId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/guilds/${guildId}/members?limit=100`,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to get guild members');
    }
  }

  async getMessageReactions(
    userAccessToken: string,
    channelId: string,
    messageId: string
  ) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/channels/${channelId}/messages/${messageId}`,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to get message reactions');
    }
  }

  async listUserGuilds(userAccessToken: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/users/@me/guilds`, {
        headers: this.getHeaders(userAccessToken),
      });
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to list user guilds');
    }
  }

  async listGuildChannels(userAccessToken: string, guildId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/guilds/${guildId}/channels`,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to list guild channels');
    }
  }

  async sendMessage(userAccessToken: string, dto: SendMessageDto) {
    const { channelId, content, embeds } = dto;

    const body: any = { content };
    if (embeds && embeds.length > 0) {
      body.embeds = embeds;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/channels/${channelId}/messages`,
        body,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to send message');
    }
  }

  async addRoleToUser(userAccessToken: string, dto: AddRoleDto) {
    const { guildId, userId, roleId } = dto;

    try {
      const response = await axios.put(
        `${this.baseUrl}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {},
        {
          headers: this.getBotHeaders(),
        }
      );

      if (response.status === 204) {
        return { success: true, message: 'Role added successfully' };
      }
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to add role to user');
    }
  }

  async createPrivateChannel(
    userAccessToken: string,
    dto: CreatePrivateChannelDto
  ) {
    const { guildId, name, type, permissionOverwrites } = dto;

    const body: any = {
      name,
      type: type || 0,
    };

    if (permissionOverwrites && permissionOverwrites.length > 0) {
      body.permission_overwrites = permissionOverwrites;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/guilds/${guildId}/channels`,
        body,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to create private channel');
    }
  }

  async getCurrentUser(userAccessToken: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/users/@me`, {
        headers: this.getHeaders(userAccessToken),
      });
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to get current user');
    }
  }

  async listGuildRoles(userAccessToken: string, guildId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/guilds/${guildId}/roles`,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to list guild roles');
    }
  }

  getHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  getBotHeaders() {
    return {
      Authorization: `Bot ${this.botToken}`,
      'Content-Type': 'application/json',
    };
  }

  async handleResponse(response: any) {
    if (response.status === 204) {
      return null;
    }
    return response.data;
  }

  getServiceMetadata() {
    return {
      name: 'discord',
      actions: [
        {
          name: 'new_message_in_channel',
          description:
            'Triggered when a new message is sent in a specific channel',
          parameters: [
            {
              name: 'channelId',
              type: 'string',
              description: 'The ID of the channel to monitor',
              required: true,
            },
          ],
        },
        {
          name: 'user_joins_guild',
          description: 'Triggered when a new user joins a Discord server',
          parameters: [
            {
              name: 'guildId',
              type: 'string',
              description: 'The ID of the guild to monitor',
              required: true,
            },
          ],
        },
        {
          name: 'reaction_added',
          description: 'Triggered when a reaction is added to a message',
          parameters: [
            {
              name: 'channelId',
              type: 'string',
              description: 'The ID of the channel containing the message',
              required: true,
            },
            {
              name: 'messageId',
              type: 'string',
              description: 'The ID of the message to monitor',
              required: true,
            },
          ],
        },
      ],
      reactions: [
        {
          name: 'send_message',
          description: 'Sends a message to a Discord channel',
          parameters: [
            {
              name: 'channelId',
              type: 'string',
              description: 'The ID of the channel to send the message to',
              required: true,
            },
            {
              name: 'content',
              type: 'string',
              description: 'The content of the message',
              required: true,
            },
            {
              name: 'embeds',
              type: 'array',
              description: 'Optional embeds for the message',
              required: false,
            },
          ],
        },
        {
          name: 'add_role_to_user',
          description: 'Adds a role to a user in a Discord server',
          parameters: [
            {
              name: 'guildId',
              type: 'string',
              description: 'The ID of the guild',
              required: true,
            },
            {
              name: 'userId',
              type: 'string',
              description: 'The ID of the user to add the role to',
              required: true,
            },
            {
              name: 'roleId',
              type: 'string',
              description: 'The ID of the role to add',
              required: true,
            },
          ],
        },
        {
          name: 'create_private_channel',
          description: 'Creates a private channel in a Discord server',
          parameters: [
            {
              name: 'guildId',
              type: 'string',
              description: 'The ID of the guild',
              required: true,
            },
            {
              name: 'name',
              type: 'string',
              description: 'The name of the channel',
              required: true,
            },
            {
              name: 'type',
              type: 'number',
              description: 'The type of channel (0=text, 2=voice, 4=category)',
              required: false,
            },
            {
              name: 'permissionOverwrites',
              type: 'array',
              description: 'Permission overwrites for the channel',
              required: false,
            },
          ],
        },
      ],
    };
  }

  async createWebhook(
    userAccessToken: string,
    channelId: string,
    name: string,
    avatar?: string
  ) {
    const body: any = { name };
    if (avatar) {
      body.avatar = avatar;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/channels/${channelId}/webhooks`,
        body,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to create webhook');
    }
  }

  async getChannelWebhooks(channelId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/channels/${channelId}/webhooks`,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to get channel webhooks');
    }
  }

  async getGuildWebhooks(guildId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/guilds/${guildId}/webhooks`,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to get guild webhooks');
    }
  }

  async getWebhook(webhookId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/webhooks/${webhookId}`,
        {
          headers: this.getBotHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to get webhook');
    }
  }

  async deleteWebhook(webhookId: string) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/webhooks/${webhookId}`,
        {
          headers: this.getBotHeaders(),
        }
      );

      if (response.status === 204) {
        return { success: true, message: 'Webhook deleted successfully' };
      }
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to delete webhook');
    }
  }

  async executeWebhook(
    webhookId: string,
    webhookToken: string,
    content: string,
    embeds?: any[]
  ) {
    const body: any = { content };
    if (embeds && embeds.length > 0) {
      body.embeds = embeds;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/webhooks/${webhookId}/${webhookToken}`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 204) {
        return { success: true, message: 'Message sent via webhook' };
      }
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to execute webhook');
    }
  }
}

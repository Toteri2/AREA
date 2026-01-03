import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { DiscordService } from 'src/discord/discord.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { Reaction, ReactionType } from 'src/shared/entities/reaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private reactionsRepository: Repository<Reaction>,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>,
    private authService: AuthService,
    private discordService: DiscordService
  ) {}

  async create(
    userId: number,
    hookId: number,
    reactionType: ReactionType,
    config: Record<string, any>
  ): Promise<Reaction> {
    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found or does not belong to user');
    }

    const reaction = this.reactionsRepository.create({
      userId,
      hookId,
      reactionType,
      config,
    });

    return this.reactionsRepository.save(reaction);
  }

  async findByHookId(hookId: number): Promise<Reaction[]> {
    return this.reactionsRepository.find({
      where: { hookId },
    });
  }

  async findByUserId(userId: number): Promise<Reaction[]> {
    return this.reactionsRepository.find({
      where: { userId },
      relations: ['hook'],
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    const reaction = await this.reactionsRepository.findOne({
      where: { id, userId },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionsRepository.delete(id);
  }

  async executeReaction(
    reaction: Reaction,
    webhookPayload: any,
    userId: number
  ): Promise<any> {
    switch (reaction.reactionType) {
      case ReactionType.SEND_EMAIL_OUTLOOK:
        return this.sendEmailOutlook(reaction.config, webhookPayload, userId);

      case ReactionType.DISCORD_SEND_MESSAGE:
        return this.sendDiscordMessage(reaction.config, webhookPayload, userId);

      case ReactionType.DISCORD_CREATE_CHANNEL:
        return this.createDiscordChannel(
          reaction.config,
          webhookPayload,
          userId
        );

      case ReactionType.DISCORD_ADD_ROLE:
        return this.addDiscordRole(reaction.config, webhookPayload, userId);
      case ReactionType.SEND_EMAIL_GMAIL:
        return this.sendEmailGmail(reaction.config, webhookPayload, userId);

      default:
        throw new Error(`Unknown reaction type: ${reaction.reactionType}`);
    }
  }

  private async sendEmailGmail(
    config: any,
    webhookPayload: any,
    userId: number
  ): Promise<any> {
    try {
      const gmailToken = await this.authService.getStoredGmailToken(userId);
      if (!gmailToken) {
        throw new Error('Gmail account not linked');
      }

      const processedConfig = this.replaceVariables(config, webhookPayload);

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${gmailToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: this.createEmailRaw(
              processedConfig.to,
              processedConfig.subject,
              processedConfig.body
            ),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send email via Gmail: ${error}`);
      }

      return { success: true, message: 'Email sent via Gmail successfully' };
    } catch (error) {
      console.error('Error sending email via Gmail:', error);
      throw error;
    }
  }

  private createEmailRaw(to: string, subject: string, body: string): string {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\n');

    return Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private async sendEmailOutlook(
    config: any,
    webhookPayload: any,
    userId: number
  ): Promise<any> {
    try {
      const microsoftToken = await this.authService.getMicrosoftToken(userId);

      if (!microsoftToken) {
        throw new Error('Microsoft account not linked');
      }

      const processedConfig = this.replaceVariables(config, webhookPayload);

      const emailBody = {
        message: {
          subject: processedConfig.subject,
          body: {
            contentType: 'Text',
            content: processedConfig.body,
          },
          toRecipients: [
            {
              emailAddress: {
                address: processedConfig.to,
              },
            },
          ],
        },
      };

      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${microsoftToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailBody),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send email: ${error}`);
      }

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending email via Outlook:', error);
      throw error;
    }
  }

  private async sendDiscordMessage(
    config: any,
    webhookPayload: any,
    userId: number
  ): Promise<any> {
    try {
      const provider = await this.authService.getDiscordProvider(userId);

      if (!provider) {
        throw new Error('Discord account not linked');
      }

      const processedConfig = this.replaceVariables(config, webhookPayload);

      const embeds = Array.isArray(processedConfig.embeds)
        ? processedConfig.embeds
        : typeof processedConfig.embeds === 'string'
          ? JSON.parse(processedConfig.embeds)
          : undefined;

      return await this.discordService.sendMessage(provider.accessToken, {
        channelId: processedConfig.channelId,
        content: processedConfig.content,
        embeds: embeds,
      });
    } catch (error) {
      console.error('Error sending Discord message:', error);
      throw error;
    }
  }

  private async createDiscordChannel(
    config: any,
    webhookPayload: any,
    userId: number
  ): Promise<any> {
    try {
      const provider = await this.authService.getDiscordProvider(userId);

      if (!provider) {
        throw new Error('Discord account not linked');
      }

      const processedConfig = this.replaceVariables(config, webhookPayload);

      const permissionOverwrites = Array.isArray(
        processedConfig.permissionOverwrites
      )
        ? processedConfig.permissionOverwrites
        : typeof processedConfig.permissionOverwrites === 'string'
          ? JSON.parse(processedConfig.permissionOverwrites)
          : undefined;

      const channelType =
        typeof processedConfig.type === 'string'
          ? parseInt(processedConfig.type, 10)
          : processedConfig.type || 0;

      return await this.discordService.createPrivateChannel(
        provider.accessToken,
        {
          guildId: processedConfig.guildId,
          name: processedConfig.name,
          type: channelType,
          permissionOverwrites: permissionOverwrites,
        }
      );
    } catch (error) {
      console.error('Error creating Discord channel:', error);
      throw error;
    }
  }

  private async addDiscordRole(
    config: any,
    webhookPayload: any,
    userId: number
  ): Promise<any> {
    try {
      const provider = await this.authService.getDiscordProvider(userId);

      if (!provider) {
        throw new Error('Discord account not linked');
      }

      const processedConfig = this.replaceVariables(config, webhookPayload);

      return await this.discordService.addRoleToUser(provider.accessToken, {
        guildId: processedConfig.guildId,
        userId: processedConfig.targetUserId,
        roleId: processedConfig.roleId,
      });
    } catch (error) {
      console.error('Error adding Discord role:', error);
      throw error;
    }
  }

  private replaceVariables(config: any, payload: any): Record<string, string> {
    const configString = JSON.stringify(config);
    const variables = this.extractVariables(payload);

    let result = configString;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return JSON.parse(result);
  }

  private extractVariables(payload: any): Record<string, any> {
    if (payload.repository) {
      return {
        repo: payload.repository.full_name,
        author: payload.sender?.login,
        branch: payload.ref?.replace('refs/heads/', ''),
        action: payload.action,
        issue_title: payload.issue?.title,
        issue_number: payload.issue?.number,
        pr_title: payload.pull_request?.title,
        pr_number: payload.pull_request?.number,
      };
    }

    if (payload.value?.[0]) {
      return {
        changeType: payload.value[0].changeType,
        resource: payload.value[0].resource,
      };
    }

    if (payload.message?.data) {
      return {
        emailAddress: payload.emailAddress || 'unknown',
        historyId: payload.message.data.historyId || 'unknown',
        timestamp: new Date().toISOString(),
      };
    }

    return {};
  }
}

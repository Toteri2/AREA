import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CreateGmailDto } from 'src/gmail/dto/create_gmail_dto';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { GmailEventType } from 'src/shared/enums/gmail.enum';
import { handleAxiosError } from 'src/shared/utils/axios.handler';
import { Repository } from 'typeorm';

@Injectable()
export class GmailService {
  constructor(
    @InjectRepository(Hook)
    private hookRepository: Repository<Hook>,
    private readonly reactionsService: ReactionsService,
    private readonly configService: ConfigService
  ) {}
  private readonly baseUrl = 'https://gmail.googleapis.com/gmail/v1/';

  async listUserWebhooks(userId: number): Promise<any> {
    const hooks = await this.hookRepository.find({
      where: { service: 'gmail', userId: userId },
    });
    return hooks;
  }

  async getUserWebhook(userId: number, hookId: number): Promise<any> {
    const hooks = await this.hookRepository.find({
      where: { service: 'gmail', userId: userId, id: hookId },
    });
    return hooks;
  }

  async createWebhook(
    body: CreateGmailDto,
    accessToken: string,
    userId: number,
    emailAddress?: string
  ) {
    const topicName = this.configService.getOrThrow<string>('GMAIL_TOPIC_NAME');
    try {
      const response = await axios.post(
        `${this.baseUrl}users/me/watch`,
        {
          topicName: topicName,
        },
        {
          headers: this.getHeaders(accessToken),
        }
      );

      const valid = await this.handleResponse(response);
      if (!valid) {
        return null;
      }

      const eventTypeValue = body.eventType || 1;
      const eventTypeName = GmailEventType[eventTypeValue];

      const hook = this.hookRepository.create({
        userId: userId,
        webhookId: valid.historyId,
        service: 'gmail',
        eventType: eventTypeValue,
        additionalInfos: {
          emailAddress: emailAddress,
          events: [eventTypeName.toLowerCase()],
        },
      });
      await this.hookRepository.save(hook);

      return { valid, hookId: hook.id };
    } catch (error) {
      handleAxiosError(error, 'Failed to create Gmail webhook');
    }
  }

  async getProfile(accessToken: string) {
    try {
      const response = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: this.getHeaders(accessToken),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to get Gmail profile');
    }
  }

  getHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async handleResponse(response: any) {
    if (response.status === 204) {
      return null;
    }
    return response.data;
  }

  async stopWatch(accessToken: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}users/me/stop`,
        {},
        {
          headers: this.getHeaders(accessToken),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to stop Gmail watch');
    }
  }

  async deleteSubscription(id: number, accessToken: string) {
    try {
      await this.stopWatch(accessToken);
    } finally {
      await this.hookRepository.delete({ id: id });
    }
    return { message: 'Webhook deleted successfully' };
  }

  async verifyEmailAddress(
    gmailToken: string,
    emailAddress: string
  ): Promise<boolean> {
    try {
      const profileResponse = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      const profile = profileResponse.data;
      return profile.emailAddress === emailAddress;
    } catch (error) {
      console.error('Error verifying email address:', error);
      handleAxiosError(error, 'Failed to verify email address');
    }
  }

  async handleGmailEvent(
    hook: Hook,
    gmailToken: string,
    oldHistoryId: string
  ): Promise<boolean> {
    const eventType = hook.eventType;

    switch (eventType) {
      case GmailEventType.MESSAGE_ADDED_INBOX:
        return this.checkMessageAddedInbox(gmailToken, oldHistoryId);

      case GmailEventType.MESSAGE_ADDED:
        return this.checkMessageAdded(gmailToken, oldHistoryId);

      case GmailEventType.MESSAGE_DELETED:
        return this.checkMessageDeleted(gmailToken, oldHistoryId);

      default:
        console.warn(`Unknown event type: ${eventType}`);
        return false;
    }
  }

  async checkMessageAddedInbox(
    gmailToken: string,
    startHistoryId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      const historyData = historyResponse.data;
      return historyData.history?.some((hist: any) =>
        hist.messagesAdded?.some((msg: any) =>
          msg.message?.labelIds?.includes('INBOX')
        )
      );
    } catch (error) {
      console.error('Error checking message added in inbox:', error);
      handleAxiosError(error, 'Failed to check message added in inbox');
    }
  }

  async checkMessageAdded(
    gmailToken: string,
    startHistoryId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      const historyData = historyResponse.data;
      return historyData.history?.some((hist: any) => hist.messagesAdded);
    } catch (error) {
      console.error('Error checking message added:', error);
      handleAxiosError(error, 'Failed to check message added');
    }
  }

  async checkMessageDeleted(
    gmailToken: string,
    startHistoryId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageDeleted&historyTypes=labelRemoved`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      const historyData = historyResponse.data;

      const hasDeleted = historyData.history?.some(
        (hist: any) => hist.messagesDeleted
      );
      const hasTrashed = historyData.history?.some((hist: any) =>
        hist.labelsRemoved?.some(
          (labelChange: any) =>
            labelChange.labelIds?.includes('INBOX') ||
            labelChange.labelIds?.includes('UNREAD')
        )
      );

      const result = hasDeleted || hasTrashed || false;
      return result;
    } catch (error) {
      console.error('Error checking message deleted:', error);
      handleAxiosError(error, 'Failed to check message deleted');
    }
  }

  async executeReactions(
    hook: Hook,
    body: any,
    emailAddress: string,
    historyId: string,
    userId: number
  ): Promise<void> {
    const reactions = await this.reactionsService.findByHookId(hook.id);

    if (reactions.length > 0) {
      for (const reaction of reactions) {
        try {
          await this.reactionsService.executeReaction(
            reaction,
            { ...body, emailAddress, historyId },
            userId
          );
        } catch (error) {
          console.error(`Failed to execute reaction ${reaction.id}:`, error);
        }
      }
    }
  }
}

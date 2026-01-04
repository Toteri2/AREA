import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGmailDto } from 'src/gmail/dto/create_gmail_dto';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { GmailEventType } from 'src/shared/enums/gmail.enum';
import { Repository } from 'typeorm';

@Injectable()
export class GmailService {
  constructor(
    @InjectRepository(Hook)
    private hookRepository: Repository<Hook>,
    private readonly reactionsService: ReactionsService
  ) {}
  private readonly baseUrl = 'https://gmail.googleapis.com/gmail/v1/';

  async listUserWebhooks(userId: number): Promise<any> {
    const hooks = await this.hookRepository.find({
      where: { service: 'gmail', userId: userId},
    });
    return hooks;
  }

  async createWebhook(
    body: CreateGmailDto,
    access_token: string,
    userId: number,
  ) {
    const response = await fetch(`${this.baseUrl}users/me/watch`, {
      method: 'POST',
      headers: this.getHeaders(access_token),
      body: JSON.stringify({
        topicName: body.topicName,
      }),
    });

    const valid = await this.handleResponse(response);
    if (!valid) {
      return null;
    }

    const hook = this.hookRepository.create({
      userId: userId,
      webhookId: valid.historyId,
      service: 'gmail',
      eventType: body.eventType || 1,
    });
    await this.hookRepository.save(hook);

    return { valid, hookId: hook.id };
  }

  getHeaders(access_token: string) {
    return {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log(error);
      throw new HttpException(
        error.message || 'Gmail request failed',
        response.status
      );
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  async stopWatch(access_token: string) {
    const response = await fetch(`${this.baseUrl}users/me/stop`, {
      method: 'POST',
      headers: this.getHeaders(access_token),
    });
    return this.handleResponse(response);
  }

  async deleteSubscription(id: string, access_token: string) {
    await this.stopWatch(access_token);
    await this.hookRepository.delete({ webhookId: id });
    return { message: 'Webhook deleted successfully' };
  }

  async verifyEmailAddress(
    gmailToken: string,
    emailAddress: string
  ): Promise<boolean> {
    try {
      const profileResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        return profile.emailAddress === emailAddress;
      }
      return false;
    } catch (error) {
      console.error('Error verifying email address:', error);
      return false;
    }
  }

  async handleGmailEvent(
    hook: Hook,
    gmailToken: string,
    historyId: string
  ): Promise<boolean> {
    const eventType = hook.eventType;

    switch (eventType) {
      case GmailEventType.MESSAGE_ADDED_INBOX:
        return this.checkMessageAddedInbox(hook, gmailToken, historyId);

      case GmailEventType.MESSAGE_ADDED:
        return this.checkMessageAdded(hook, gmailToken, historyId);

      case GmailEventType.MESSAGE_DELETED:
        return this.checkMessageDeleted(hook, gmailToken, historyId);

      default:
        console.warn(`Unknown event type: ${eventType}`);
        return false;
    }
  }

  async checkMessageAddedInbox(
    hook: Hook,
    gmailToken: string,
    historyId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${hook.lastHistoryId || historyId}&historyTypes=messageAdded`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        return historyData.history?.some((hist: any) =>
          hist.messagesAdded?.some((msg: any) =>
            msg.message?.labelIds?.includes('INBOX')
          )
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking message added in inbox:', error);
      return false;
    }
  }

  async checkMessageAdded(
    hook: Hook,
    gmailToken: string,
    historyId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${hook.lastHistoryId || historyId}&historyTypes=messageAdded`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        return historyData.history?.some((hist: any) => hist.messagesAdded);
      }
      return false;
    } catch (error) {
      console.error('Error checking message added:', error);
      return false;
    }
  }

  async checkMessageDeleted(
    hook: Hook,
    gmailToken: string,
    historyId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${hook.lastHistoryId || historyId}&historyTypes=messageDeleted`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        return historyData.history?.some((hist: any) => hist.messagesDeleted);
      }
      return false;
    } catch (error) {
      console.error('Error checking message deleted:', error);
      return false;
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

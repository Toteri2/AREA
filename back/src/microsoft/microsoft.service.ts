import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CreateMicrosoftDto } from 'src/microsoft/dto/create_microsoft_dto';
import { Hook } from 'src/shared/entities/hook.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MicrosoftService {
  constructor(
    @InjectRepository(Hook)
    private hookRepository: Repository<Hook>
  ) {}
  private readonly baseUrl = 'https://graph.microsoft.com/v1.0/';
  async listUserWebhooks(userId: number): Promise<any> {
    return this.hookRepository.find({
      where: { service: 'microsoft', userId: userId },
    });
  }

  async getUserWebhook(userId: number, hookId: number): Promise<any> {
    return this.hookRepository.findOne({
      where: { service: 'microsoft', id: hookId, userId: userId },
    });
  }

  async createWebhook(
    body: CreateMicrosoftDto,
    accessToken: string,
    webhookUrl: string,
    userId: number,
    state: string,
    emailAddress?: string
  ) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 2);
    const response = await axios.post(
      `${this.baseUrl}/subscriptions`,
      {
        changeType: body.changeType,
        notificationUrl: webhookUrl,
        lifecycleNotificationUrl: webhookUrl,
        resource: body.resource,
        expirationDateTime: expirationDate.toISOString(),
        clientState: state,
      },
      {
        headers: this.getHeaders(accessToken),
      }
    );
    const valid = await this.handleResponse(response);
    if (!valid) return null;
    const hook = this.hookRepository.create({
      userId: userId,
      webhookId: valid.id,
      service: 'microsoft',
      additionalInfos: {
        emailAddress: emailAddress,
        events: Array.isArray(body.changeType)
          ? body.changeType
          : [body.changeType],
        resource: body.resource,
      },
    });
    await this.hookRepository.save(hook);

    return { valid, hookId: hook.id };
  }

  getHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getProfile(accessToken: string) {
    const response = await axios.get(`${this.baseUrl}me`, {
      headers: this.getHeaders(accessToken),
    });
    return this.handleResponse(response);
  }

  async handleResponse(response: any) {
    if (response.status >= 400) {
      const error = response.data || {};
      console.log(error);
      throw new HttpException(
        error.message || 'Microsoft request failed',
        response.status
      );
    }
    if (response.status === 204) {
      return null;
    }
    return response.data;
  }

  async deleteSubscription(id: number, accessToken: string, webhookId: string) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}subscriptions/${webhookId}`,
        {
          headers: this.getHeaders(accessToken),
        }
      );
      return this.handleResponse(response);
    } finally {
      await this.hookRepository.delete({ id: id });
    }
  }
}

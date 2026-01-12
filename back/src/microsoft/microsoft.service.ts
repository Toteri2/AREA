import { Injectable } from '@nestjs/common';
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
  async listUserWebhooks(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        'https://graph.microsoft.com/v1.0/subscriptions',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data.value;
    } catch (error) {
      console.log('Failed to fetch webhooks:', error.message);
      throw new Error('Failed to fetch webhooks from Microsoft Graph API');
    }
  }

  async createWebhook(
    body: CreateMicrosoftDto,
    accessToken: string,
    webhookUrl: string,
    userId: number,
    state: string
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

  async handleResponse(response: any) {
    if (response.status === 204) {
      return null;
    }
    return response.data;
  }

  async deleteSubscription(id: string, accessToken: string) {
    const response = await axios.delete(`${this.baseUrl}/subscriptions/${id}`, {
      headers: this.getHeaders(accessToken),
    });
    await this.hookRepository.delete({ webhookId: id });
    return this.handleResponse(response);
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/subscriptions',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      console.log('Failed to fetch webhooks:', response.statusText);
      throw new Error('Failed to fetch webhooks from Microsoft Graph API');
    }
    const data = await response.json();
    return data.value;
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
    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({
        changeType: body.changeType,
        notificationUrl: webhookUrl,
        lifecycleNotificationUrl: webhookUrl,
        resource: body.resource,
        expirationDateTime: expirationDate.toISOString(),
        clientState: state,
      }),
    });
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

  async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log(error);
      throw new HttpException(
        error.message || 'Microsoft request failed',
        response.status
      );
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  async deleteSubscription(id: string, accessToken: string) {
    const response = await fetch(`${this.baseUrl}/subscriptions/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(accessToken),
    });
    await this.hookRepository.delete({ webhookId: id });
    return this.handleResponse(response);
  }
}

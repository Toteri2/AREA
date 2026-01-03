import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGmailDto } from 'src/gmail/dto/create_gmail_dto';
import { Hook } from 'src/shared/entities/hook.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GmailService {
  constructor(
    @InjectRepository(Hook)
    private hookRepository: Repository<Hook>
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
}

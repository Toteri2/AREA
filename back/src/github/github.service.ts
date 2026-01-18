import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { handleAxiosError } from '../shared/utils/axios.handler';
import { CreateWebhookDto } from './dto/create_git_webhook.dto';

@Injectable()
export class GithubService {
  private readonly baseUrl = 'https://api.github.com';

  constructor(private configService: ConfigService) {}

  async createWebhook(
    userAccessToken: string,
    dto: CreateWebhookDto,
    webhookUrl: string
  ) {
    const { owner, repo, events } = dto;

    const webhookSecret = this.configService.getOrThrow<string>(
      'GITHUB_WEBHOOK_SECRET'
    );

    try {
      const response = await axios.post(
        `${this.baseUrl}/repos/${owner}/${repo}/hooks`,
        {
          name: 'web',
          active: true,
          events,
          config: {
            url: webhookUrl,
            content_type: 'json',
            insecure_ssl: '0',
            secret: webhookSecret,
          },
        },
        {
          headers: this.getHeaders(userAccessToken),
        }
      );
      const result = await this.handleResponse(response);
      return result;
    } catch (error) {
      handleAxiosError(error, 'Failed to create GitHub webhook');
    }
  }

  async listUserRepositories(userAccessToken: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/repos?per_page=100`,
        {
          headers: this.getHeaders(userAccessToken),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to list user repositories');
    }
  }

  async listWebhooks(userAccessToken: string, owner: string, repo: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/hooks`,
        {
          headers: this.getHeaders(userAccessToken),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to list webhooks');
    }
  }

  async deleteWebhook(
    userAccessToken: string,
    owner: string,
    repo: string,
    hookId: string
  ) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/repos/${owner}/${repo}/hooks/${hookId}`,
        {
          headers: this.getHeaders(userAccessToken),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      handleAxiosError(error, 'Failed to delete webhook');
    }
  }

  getHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
  }

  async handleResponse(response: any) {
    if (response.status === 204) {
      return null;
    }
    return response.data;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature) {
      return false;
    }

    try {
      const webhookSecret = this.configService.getOrThrow<string>(
        'GITHUB_WEBHOOK_SECRET'
      );

      if (!webhookSecret) {
        return true;
      }
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(payload);
      const expectedSignature = 'sha256=' + hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }
}

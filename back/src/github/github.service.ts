import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CreateWebhookDto } from './dto/create_git_webhook.dto';

@Injectable()
export class GithubService {
  private readonly baseUrl = 'https://api.github.com';

  async createWebhook(
    userAccessToken: string,
    dto: CreateWebhookDto,
    webhookUrl: string
  ) {
    const { owner, repo, events, secret } = dto;
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
          ...(secret && { secret }),
        },
      },
      {
        headers: this.getHeaders(userAccessToken),
      }
    );
    const result = await this.handleResponse(response);
    return result;
  }

  async listUserRepositories(userAccessToken: string) {
    const response = await axios.get(
      `${this.baseUrl}/user/repos?per_page=100`,
      {
        headers: this.getHeaders(userAccessToken),
      }
    );
    return this.handleResponse(response);
  }

  async listWebhooks(userAccessToken: string, owner: string, repo: string) {
    const response = await axios.get(
      `${this.baseUrl}/repos/${owner}/${repo}/hooks`,
      {
        headers: this.getHeaders(userAccessToken),
      }
    );
    return this.handleResponse(response);
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
}

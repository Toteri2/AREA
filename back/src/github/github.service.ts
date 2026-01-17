import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { handleAxiosError } from '../shared/utils/axios.handler';
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
            ...(secret && { secret }),
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
}

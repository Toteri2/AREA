import { HttpException, Injectable } from '@nestjs/common';
import { CreateWebhookDto } from './dto/create_git_webhook.dto';

@Injectable()
export class GithubService {
  private readonly baseUrl = 'https://api.github.com';

  async createWebhook(userAccessToken: string, dto: CreateWebhookDto, webhookUrl: string) {
    const { owner, repo, events, secret } = dto;
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/hooks`,
      {
        method: 'POST',
        headers: this.getHeaders(userAccessToken),
        body: JSON.stringify({
          name: 'web',
          active: true,
          events,
          config: {
            url: webhookUrl,
            content_type: 'json',
            insecure_ssl: '0',
            ...(secret && { secret }),
          },
        }),
      }
    );
    return this.handleResponse(response);
  }

  async listUserRepositories(userAccessToken: string) {
    const response = await fetch(`${this.baseUrl}/user/repos?per_page=100`, {
      headers: this.getHeaders(userAccessToken),
    });
    return this.handleResponse(response);
  }

  async listWebhooks(userAccessToken: string, owner: string, repo: string) {
    const response = await fetch(
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

  async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new HttpException(
        error.message || 'GitHub request failed',
        response.status
      );
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }
}

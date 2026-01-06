import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { Repository } from 'typeorm';
import { CreateJiraWebhookDto } from './dto/create_jira_webhook.dto';

@Injectable()
export class JiraService {
  constructor(
    @InjectRepository(Hook)
    private hookRepository: Repository<Hook>,
    private readonly authService: AuthService
  ) {}

  async listUserWebhooks(userId: number): Promise<any> {
    const hooks = await this.hookRepository.find({
      where: { service: 'jira', userId: userId },
    });
    return hooks;
  }

  async createWebhook(
    body: CreateJiraWebhookDto,
    accessToken: string,
    cloudId: string,
    webhookUrl: string,
    userId: number
  ): Promise<any> {
    try {
      const webhookData = {
        url: webhookUrl,
        webhooks: [
          {
            jqlFilter: `project = ${body.projectKey}`,
            events: body.events,
          },
        ],
      };

      const response = await axios.post(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`,
        webhookData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const results = response.data.webhookRegistrationResult;
      if (!results || !Array.isArray(results) || results.length === 0) {
        throw new Error(`Unexpected response from Jira API: ${JSON.stringify(response.data)}`);
      }

      const createdWebhook = results[0];
      if (createdWebhook.errors) {
        throw new Error(`Jira webhook validation failed: ${createdWebhook.errors.join(', ')}`);
      }

      const webhookId = createdWebhook.createdWebhookId;

      const hook = this.hookRepository.create({
        userId: userId,
        webhookId: webhookId.toString(),
        service: 'jira',
      });

      await this.hookRepository.save(hook);

      return {
        success: true,
        webhookId: webhookId,
        hookId: hook.id,
        message: 'Jira webhook created successfully',
      };
    } catch (error) {
      console.error('Error creating Jira webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteWebhook(
    webhookId: string,
    accessToken: string,
    cloudId: string
  ): Promise<void> {
    try {
      await axios.delete(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook/${webhookId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      await this.hookRepository.delete({ webhookId });
    } catch (error) {
      console.error(
        'Error deleting Jira webhook:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getIssue(userId: number, issueKey: string): Promise<any> {
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider || !provider.accessToken || !provider.providerId) {
      throw new Error('Jira account not linked or missing cloud ID');
    }

    const accessToken = await this.authService.getValidJiraToken(userId);
    const cloudId = provider.providerId;

    const response = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    return response.data;
  }

  async listProjects(userId: number): Promise<any> {
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider || !provider.accessToken || !provider.providerId) {
      throw new Error('Jira account not linked or missing cloud ID');
    }

    const accessToken = await this.authService.getValidJiraToken(userId);
    const cloudId = provider.providerId;

    const response = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    return response.data;
  }
}

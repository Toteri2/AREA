import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as crypto from 'crypto';
import { AuthService } from 'src/auth/auth.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { handleAxiosError } from 'src/shared/utils/axios.handler';
import { Repository } from 'typeorm';
import { CreateJiraWebhookDto } from './dto/create_jira_webhook.dto';

@Injectable()
export class JiraService {
  constructor(
    @InjectRepository(Hook)
    private hookRepository: Repository<Hook>,
    private readonly authService: AuthService,
    private readonly configService: ConfigService
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
      const webhookSecret = this.configService.getOrThrow<string>(
        'JIRA_WEBHOOK_SECRET'
      );
      const fullWebhookUrl = `${webhookUrl}?secret=${webhookSecret}`;
      const projectResponse = await axios.get(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/${body.projectKey}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      const projectName = projectResponse.data.name;
      const webhookData = {
        url: fullWebhookUrl,
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
        throw new Error(
          `Unexpected response from Jira API: ${JSON.stringify(response.data)}`
        );
      }

      const createdWebhook = results[0];
      if (createdWebhook.errors) {
        throw new Error(
          `Jira webhook validation failed: ${createdWebhook.errors.join(', ')}`
        );
      }

      const webhookId = createdWebhook.createdWebhookId;

      const hook = this.hookRepository.create({
        userId: userId,
        webhookId: webhookId.toString(),
        service: 'jira',
        additionalInfos: {
          projectName: projectName,
          projectKey: body.projectKey,
          events: body.events,
        },
      });

      await this.hookRepository.save(hook);

      return {
        success: true,
        webhookId: webhookId,
        hookId: hook.id,
        message: 'Jira webhook created successfully',
      };
    } catch (error) {
      console.log('Jira webhook creation error details:', error);
      console.error(
        'Error creating Jira webhook:',
        error.response?.data || error.message
      );
      handleAxiosError(error, 'Failed to create Jira webhook');
    }
  }

  async deleteWebhook(
    webhookId: string,
    accessToken: string,
    cloudId: string
  ): Promise<void> {
    try {
      await axios.delete(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          data: {
            webhookIds: [webhookId],
          },
        }
      );

      await this.hookRepository.delete({ webhookId });
    } catch (error) {
      console.error(
        'Error deleting Jira webhook:',
        error.response?.data || error.message
      );
      handleAxiosError(error, 'Failed to delete Jira webhook');
    }
  }

  async getIssue(userId: number, issueKey: string): Promise<any> {
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider || !provider.accessToken || !provider.providerId) {
      throw new Error('Jira account not linked or missing cloud ID');
    }

    const accessToken = await this.authService.getValidJiraToken(userId);
    const cloudId = provider.providerId;

    try {
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
    } catch (error) {
      handleAxiosError(error, 'Failed to get Jira issue');
    }
  }

  async listProjects(userId: number): Promise<any> {
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider || !provider.accessToken || !provider.providerId) {
      throw new Error('Jira account not linked or missing cloud ID');
    }

    const accessToken = await this.authService.getValidJiraToken(userId);
    const cloudId = provider.providerId;

    try {
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
    } catch (error) {
      handleAxiosError(error, 'Failed to list Jira projects');
    }
  }

  async listProjectIssues(userId: number, projectKey: string): Promise<any> {
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider || !provider.accessToken || !provider.providerId) {
      throw new Error('Jira account not linked or missing cloud ID');
    }

    const accessToken = await this.authService.getValidJiraToken(userId);
    const cloudId = provider.providerId;

    try {
      const response = await axios.post(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql`,
        {
          jql: `project = ${projectKey}`,
          maxResults: 100,
          fields: [
            'key',
            'summary',
            'status',
            'assignee',
            'priority',
            'issuetype',
            'created',
            'updated',
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      handleAxiosError(error, 'Failed to list project issues');
    }
  }

  verifyJiraWebhookSecret(providedSecret: string): boolean {
    if (!providedSecret) {
      return false;
    }

    try {
      const jiraWebhookSecret = this.configService.get<string>(
        'JIRA_WEBHOOK_SECRET'
      );
      if (!jiraWebhookSecret) {
        return true;
      }
      return crypto.timingSafeEqual(
        Buffer.from(providedSecret),
        Buffer.from(jiraWebhookSecret)
      );
    } catch {
      return false;
    }
  }
}

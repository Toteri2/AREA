import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { Repository } from 'typeorm';
import { CreateJiraWebhookDto } from './dto/create_jira_webhook.dto';
import { JiraWebhookDto } from './dto/jira-webhook.dto';
import { JiraService } from './jira.service';

@Controller('jira')
@ApiTags('jira')
export class JiraController {
  constructor(
    private readonly jiraService: JiraService,
    private readonly authService: AuthService,
    private readonly reactionsService: ReactionsService,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Receive Jira webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully.',
  })
  async handleWebhook(@Body() webhookData: JiraWebhookDto) {
    try {
      console.log('Jira webhook received:', webhookData.webhookEvent);

      const hooks = await this.hooksRepository.find({
        where: { service: 'jira' },
      });

      for (const hook of hooks) {
        try {
          const reactions = await this.reactionsService.findByHookId(hook.id);

          for (const reaction of reactions) {
            try {
              await this.reactionsService.executeReaction(
                reaction,
                webhookData,
                hook.userId
              );
            } catch (error) {
              console.error(
                `Failed to execute reaction ${reaction.id}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(`Error processing hook ${hook.id}:`, error);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling Jira webhook:', error.message);
      throw error;
    }
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List all Jira webhooks for the logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'Jira webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listWebhooks(@Req() req) {
    const provider = await this.authService.getJiraProvider(req.user.id);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }
    return this.jiraService.listUserWebhooks(req.user.id);
  }

  @Post('create-webhook')
  @ApiOperation({ summary: 'Create a Jira webhook via OAuth 2.0' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(@Req() req, @Body() body: CreateJiraWebhookDto) {
    const provider = await this.authService.getJiraProvider(req.user.id);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }

    const webhookUrl = process.env.JIRA_WEBHOOK_URL ?? '';
    const accessToken = await this.authService.getValidJiraToken(req.user.id);

    return this.jiraService.createWebhook(
      body,
      accessToken,
      provider.providerId || '',
      webhookUrl,
      req.user.id
    );
  }

  @Delete('webhook')
  @ApiOperation({ summary: 'Delete a Jira webhook' })
  @ApiResponse({
    status: 200,
    description: 'The webhook has been successfully deleted.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteWebhook(@Req() req, @Query('id') id: string) {
    try {
      const accessToken = await this.authService.getValidJiraToken(req.user.id);
      const provider = await this.authService.getJiraProvider(req.user.id);

      if (!provider || !provider.providerId) {
        throw new UnauthorizedException('Jira account not linked');
      }

      await this.jiraService.deleteWebhook(
        id,
        accessToken,
        provider.providerId
      );
      return { message: 'Webhook deleted successfully' };
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  @Get('projects')
  @ApiOperation({ summary: 'List all Jira projects accessible by the user' })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listProjects(@Req() req) {
    const provider = await this.authService.getJiraProvider(req.user.id);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }

    try {
      const projects = await this.jiraService.listProjects(req.user.id);
      return projects;
    } catch (error) {
      console.error('Error fetching Jira projects:', error.message);
      throw error;
    }
  }

  @Get('issue/:issueKey')
  @ApiOperation({ summary: 'Get details of a specific Jira issue' })
  @ApiResponse({
    status: 200,
    description: 'Issue details retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getIssue(@Req() req, @Query('issueKey') issueKey: string) {
    const provider = await this.authService.getJiraProvider(req.user.id);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }

    try {
      const issue = await this.jiraService.getIssue(req.user.id, issueKey);
      return issue;
    } catch (error) {
      console.error('Error fetching Jira issue:', error.message);
      throw error;
    }
  }
}

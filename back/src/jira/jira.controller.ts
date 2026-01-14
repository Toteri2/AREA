import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Jira webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully.',
  })
  async handleWebhook(@Body() webhookData: JiraWebhookDto, @Res() res) {
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

      return res.status(HttpStatus.OK).send({ success: true });
    } catch (error) {
      console.error('Error handling Jira webhook:', error.message);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ error: 'Failed to process webhook' });
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
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }
    return this.jiraService.listUserWebhooks(userId);
  }

  @Get('webhook')
  @ApiOperation({ summary: 'List all webhooks for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getAllWebhooks(@Req() req) {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }
    return this.jiraService.listUserWebhooks(userId);
  }

  @Get('webhook/:hookId')
  @ApiOperation({ summary: 'Get details of a specific webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook details retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getWebhookDetails(@Req() req, @Param('hookId') hookId: number) {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }

    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: userId, service: 'jira' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    return hook;
  }

  @Post('create-webhook')
  @ApiOperation({ summary: 'Create a Jira webhook' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(@Req() req, @Body() body: CreateJiraWebhookDto) {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }

    const webhookUrl =
      this.configService.getOrThrow<string>('JIRA_WEBHOOK_URL');
    const accessToken = await this.authService.getValidJiraToken(userId);

    return this.jiraService.createWebhook(
      body,
      accessToken,
      provider.providerId,
      webhookUrl,
      userId
    );
  }

  @Delete('webhook/:hookId')
  @ApiOperation({ summary: 'Delete a Jira webhook' })
  @ApiResponse({
    status: 200,
    description: 'The webhook has been successfully deleted.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteWebhook(@Req() req, @Param('hookId') hookId: number) {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new UnauthorizedException('No user session found');
      }
      const accessToken = await this.authService.getValidJiraToken(userId);
      const provider = await this.authService.getJiraProvider(userId);

      if (!provider || !provider.providerId) {
        throw new UnauthorizedException('Jira account not linked');
      }

      const hook = await this.hooksRepository.findOne({
        where: { id: hookId, userId: userId, service: 'jira' },
      });

      if (!hook) {
        throw new NotFoundException('Hook not found');
      }

      await this.jiraService.deleteWebhook(
        hook.webhookId,
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
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }

    try {
      const projects = await this.jiraService.listProjects(userId);
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
  async getIssue(@Req() req, @Param('issueKey') issueKey: string) {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }

    try {
      const issue = await this.jiraService.getIssue(userId, issueKey);
      return issue;
    } catch (error) {
      console.error('Error fetching Jira issue:', error.message);
      throw error;
    }
  }

  @Get(':projectKey/issues')
  @ApiOperation({ summary: 'List all issues for a specific Jira project' })
  @ApiResponse({
    status: 200,
    description: 'Issues retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listProjectIssues(@Req() req, @Param('projectKey') projectKey: string) {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('No user session found');
    }
    const provider = await this.authService.getJiraProvider(userId);
    if (!provider) {
      throw new UnauthorizedException('Jira account not linked');
    }

    try {
      const issues = await this.jiraService.listProjectIssues(
        userId,
        projectKey
      );
      return issues;
    } catch (error) {
      console.error('Error fetching Jira project issues:', error.message);
      throw error;
    }
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CreateWebhookDto } from './dto/create_git_webhook.dto';
import { GithubService } from './github.service';

@ApiTags('github')
@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly authService: AuthService,
    private readonly reactionsService: ReactionsService,
    private readonly configService: ConfigService,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle GitHub webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event received successfully.',
  })
  async webhook(
    @Body() body: any,
    @Headers('x-github-delivery') deliveryId: string,
    @Headers('x-github-hook-id') hookId: string
  ) {
    console.log('GitHub webhook received:', deliveryId);
    console.log('Payload:', body);

    if (body.repository) {
      const _repoFullName = body.repository.full_name;

      const hooks = await this.hooksRepository.find({
        where: { webhookId: hookId, service: 'github' },
      });

      for (const hook of hooks) {
        const reactions = await this.reactionsService.findByHookId(hook.id);

        for (const reaction of reactions) {
          try {
            await this.reactionsService.executeReaction(
              reaction,
              body,
              hook.userId
            );
          } catch (error) {
            console.error(`Failed to execute reaction ${reaction.id}:`, error);
          }
        }
      }
    }

    return { success: true };
  }

  @Post('create-webhook')
  @ApiOperation({ summary: 'Create a GitHub webhook' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(@Req() req, @Body() createWebhookDto: CreateWebhookDto) {
    const provider = await this.authService.getGithubProvider(req.user.id);
    const webhookUrl =
      this.configService.getOrThrow<string>('GITHUB_WEBHOOK_URL');
    if (!provider) throw new UnauthorizedException('GitHub account not linked');
    const result = await this.githubService.createWebhook(
      provider.accessToken,
      createWebhookDto,
      webhookUrl
    );
    const hook = this.hooksRepository.create({
      userId: req.user.id,
      webhookId: result.id,
      service: 'github',
    });
    const savedHook = await this.hooksRepository.save(hook);
    return { result, hookId: savedHook.id };
  }

  @Get('repositories')
  @ApiOperation({ summary: 'List user GitHub repositories' })
  @ApiResponse({
    status: 200,
    description: 'List of repositories retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listRepositories(@Req() req) {
    const provider = await this.authService.getGithubProvider(req.user.id);
    if (!provider) throw new UnauthorizedException('GitHub account not linked');
    return this.githubService.listUserRepositories(provider.accessToken);
  }

  @Get('repositories/:owner/:repo/webhooks')
  @ApiOperation({ summary: 'List webhooks for a GitHub repository' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listWebhooks(
    @Req() req,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const provider = await this.authService.getGithubProvider(req.user.id);
    if (!provider) throw new UnauthorizedException('GitHub account not linked');
    return this.githubService.listWebhooks(provider.accessToken, owner, repo);
  }
}

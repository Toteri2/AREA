import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
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
import { ProviderGuard, RequireProvider } from '../auth/guards/provider.guard';
import { ProviderType } from '../shared/enums/provider.enum';
import { CreateWebhookDto } from './dto/create_git_webhook.dto';
import { GithubService } from './github.service';

@ApiTags('github')
@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly reactionsService: ReactionsService,
    private readonly configService: ConfigService,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle GitHub webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event received successfully.',
  })
  async webhook(
    @Body() body: any,
    @Headers('x-github-delivery') deliveryId: string,
    @Headers('x-github-hook-id') hookId: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req
  ) {
    const rawBody = JSON.stringify(body);
    const isValid = this.githubService.verifyWebhookSignature(
      rawBody,
      signature
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a GitHub webhook' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook data.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.GITHUB)
  async createWebhook(@Req() req, @Body() createWebhookDto: CreateWebhookDto) {
    try {
      const userId = req.user.id;

      if (!createWebhookDto.owner || !createWebhookDto.repo) {
        throw new BadRequestException('Owner and repository are required');
      }

      const webhookUrl =
        this.configService.getOrThrow<string>('GITHUB_WEBHOOK_URL');
      const { owner, repo, events } = createWebhookDto;
      const result = await this.githubService.createWebhook(
        req.provider.accessToken,
        createWebhookDto,
        webhookUrl
      );
      const hook = this.hooksRepository.create({
        userId: userId,
        webhookId: result.id,
        service: 'github',
        additionalInfos: { owner, repo, events },
      });
      const savedHook = await this.hooksRepository.save(hook);
      return { result, hookId: savedHook.id };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Failed to create GitHub webhook:', error);
      throw new InternalServerErrorException('Failed to create webhook');
    }
  }

  @Get('webhook')
  @ApiOperation({ summary: 'List all GitHub webhooks for the user' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getAllWebhooks(@Req() req) {
    const userId = req.user.id;
    const hooks = await this.hooksRepository.find({
      where: { userId: userId, service: 'github' },
    });
    return hooks;
  }

  @Get('webhook/:hookId')
  @ApiOperation({ summary: 'Get details of a specific GitHub webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook details retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getWebhookDetails(@Req() req, @Param('hookId') hookId: number) {
    const userId = req.user.id;
    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: userId, service: 'github' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    return hook;
  }

  @Get('repositories')
  @ApiOperation({ summary: 'List user GitHub repositories' })
  @ApiResponse({
    status: 200,
    description: 'List of repositories retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.GITHUB)
  async listRepositories(@Req() req) {
    return this.githubService.listUserRepositories(req.provider.accessToken);
  }

  @Get('repositories/:owner/:repo/webhooks')
  @ApiOperation({ summary: 'List webhooks for a GitHub repository' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'GitHub account not linked.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.GITHUB)
  async listWebhooks(
    @Req() req,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    return this.githubService.listWebhooks(
      req.provider.accessToken,
      owner,
      repo
    );
  }

  @Delete('webhook/:hookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a GitHub webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'GitHub account not linked.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hook not found.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.GITHUB)
  async deleteWebhook(@Req() req, @Param('hookId') hookId: number) {
    const userId = req.user.id;

    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: userId, service: 'github' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    const { owner, repo } = hook.additionalInfos as {
      owner: string;
      repo: string;
    };

    await this.githubService.deleteWebhook(
      req.provider.accessToken,
      owner,
      repo,
      hook.webhookId
    );
    await this.hooksRepository.delete({ id: hookId, service: 'github' });
    return { success: true };
  }
}

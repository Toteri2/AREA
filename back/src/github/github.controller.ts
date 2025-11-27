import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { CreateWebhookDto } from './dto/create_git_webhook.dto';
import { GithubService } from './github.service';

@ApiTags('github')
@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly authService: AuthService
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle GitHub webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event received successfully.',
  })
  async webhook(@Body() body: any) {
    console.log(body);
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
    const webhookUrl = process.env.GITHUB_WEBHOOK_URL ?? '';
    if (!provider) throw new UnauthorizedException('GitHub account not linked');
    return this.githubService.createWebhook(
      provider.accessToken,
      createWebhookDto,
      webhookUrl
    );
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

import { Controller, Req, Post, Get, Body, Param, Delete, UseGuards, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { GithubService } from './github.service'
import { CreateWebhookDto } from './dto/create_git_webhook.dto'
import { AuthService } from '../auth/auth.service'

@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly authService: AuthService
  ) { }

  @Post('webhook')
  async webhook(@Body() body: any) {
    console.log(body)
  }

  @Post('create-webhook')
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(@Req() req, @Body() createWebhookDto: CreateWebhookDto) {
    const provider = await this.authService.getGithubProvider(req.user.id)
    if (!provider)
      throw new UnauthorizedException('GitHub account not linked')
    return this.githubService.createWebhook(provider.accessToken, createWebhookDto)
  }

  @Get('repositories')
  @UseGuards(AuthGuard('jwt'))
  async listRepositories(@Req() req) {
    const provider = await this.authService.getGithubProvider(req.user.id)
    if (!provider)
      throw new UnauthorizedException('GitHub account not linked')
    return this.githubService.listUserRepositories(provider.accessToken)
  }

  @Get('repositories/:owner/:repo/webhooks')
  @UseGuards(AuthGuard('jwt'))
  async listWebhooks(@Req() req, @Param('owner') owner: string, @Param('repo') repo: string) {
    const provider = await this.authService.getGithubProvider(req.user.id)
    if (!provider)
      throw new UnauthorizedException('GitHub account not linked')
    return this.githubService.listWebhooks(provider.accessToken, owner, repo)
  }
}

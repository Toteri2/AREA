import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { JwtSessionGuard } from './guards/jwt-session.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string }) {
    const user = await this.authService.register(body.email, body.password, body.name)
    return { id: user.id, email: user.email, name: user.name }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password)
    if (!user) {
      throw new Error('Invalid credentials')
    }
    return this.authService.login(user)
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    return { id: req.user.id, email: req.user.email, name: req.user.name }
  }

  @Get('github')
  @UseGuards(JwtSessionGuard, AuthGuard('github'))
  async githubAuth(@Req() req) {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req) {
    const { githubId, username, accessToken, refreshToken } = req.user
    const userId = req.session.userId
    if (!userId)
      throw new Error('No session found')
    await this.authService.linkGithubAccount(userId, githubId, accessToken, refreshToken, username)
    return { message: 'GitHub account linked successfully', username }
  }
}

import { Controller, Post, Get, Body, UseGuards, Req, Options } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { JwtSessionGuard } from './guards/jwt-session.guard'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully registered.' })
  async register(@Body() body: { email: string; password: string; name: string }) {
    const user = await this.authService.register(body.email, body.password, body.name)
    return { id: user.id, email: user.email, name: user.name }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'The user has been successfully logged in.' })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password)
    if (!user) {
      throw new Error('Invalid credentials')
    }
    return this.authService.login(user)
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the profile of the logged-in user' })
  @ApiResponse({ status: 200, description: 'The user profile has been successfully retrieved.' })
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    return { id: req.user.id, email: req.user.email, name: req.user.name }
  }

  @Get('github')
  @ApiOperation({ summary: 'Link GitHub account' })
  @ApiResponse({ status: 302, description: 'Redirect to GitHub for authentication.' })
  @UseGuards(JwtSessionGuard, AuthGuard('github'))
  async githubAuth(@Req() req) { }

  @Get('github/callback')
  @ApiOperation({ summary: 'GitHub authentication callback' })
  @ApiResponse({ status: 200, description: 'GitHub account linked successfully.' })
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

import { Controller, Post, Get, Body, UseGuards, Req, Query, Res } from '@nestjs/common'
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

  @Get('github/state')
  @ApiOperation({ summary: 'GitHub authentication state handler. Depreciated (Not to use anymore)' })
  @ApiResponse({ status: 200, description: 'GitHub authentication state received.' })
  @UseGuards(JwtSessionGuard)
  async githubAuthState(@Req() req) {
    const userId = req.session.userId
    const state = await this.authService.createOAuthStateToken(userId)
    return state
  }

  @Get('github/validate')
  @ApiOperation({ summary: 'GitHub authentication callback. Is going to validate the GitHub account and link it to the user' })
  @ApiResponse({ status: 200, description: 'GitHub account linked successfully.' })
  async githubAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res) {
    const userId = await this.authService.validateOAuthState(state)
    console.log('GitHub auth callback for user ID:', userId)
    if (!userId)
      throw new Error('No session found')
    const access_token = await this.authService.getGithubToken(code)
    await this.authService.linkGithubAccount(userId, access_token)
    return res.redirect('http://localhost:5173/profile')
  }
}

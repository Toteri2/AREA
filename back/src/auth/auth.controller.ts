import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtSessionGuard } from './guards/jwt-session.guard';

export enum ProviderType {
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully registered.',
  })
  @ApiResponse({
    status: 409,
    description: 'Credentials already in use.',
  })
  async register(
    @Body() body: { email: string; password: string; name: string },
    @Res() res
  ) {
    try {
      const user = await this.authService.register(
        body.email,
        body.password,
        body.name
      );
      console.log('Registered user:', user);
      return res
        .status(201)
        .send({ id: user.id, email: user.email, name: user.name });
    } catch (error) {
      console.log('Registration error with code:', error.code);
      if (error.code === '23505') {
        return res.status(409).send({ message: 'Credentials already in use' });
      }
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged in.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
  })
  async login(@Body() body: { email: string; password: string }, @Res() res) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    const token = await this.authService.login(user);
    return res.status(200).send(token);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the profile of the logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'The user profile has been successfully retrieved.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    return { id: req.user.id, email: req.user.email, name: req.user.name };
  }

  @Get('github/state')
  @ApiOperation({
    summary: 'GitHub authentication state handler.',
  })
  @ApiResponse({
    status: 200,
    description: 'GitHub authentication state received.',
  })
  @UseGuards(JwtSessionGuard)
  async githubAuthState(@Req() req) {
    const userId = req.session.userId;
    const state = await this.authService.createOAuthStateToken(
      userId,
      ProviderType.GITHUB
    );
    return state;
  }

  @Get('github/validate')
  @ApiOperation({
    summary:
      'GitHub authentication callback. Is going to validate the GitHub account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'GitHub account linked successfully.',
  })
  async githubAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res
  ) {
    const userId = await this.authService.validateOAuthState(
      state,
      ProviderType.GITHUB
    );
    console.log('GitHub auth callback for user ID:', userId);
    if (!userId) throw new Error('No session found');
    const access_token = await this.authService.getGithubToken(code);
    await this.authService.linkGithubAccount(userId, access_token);
    return res.redirect('http://localhost:5173/profile');
  }

  @Get('microsoft/url')
  async microsoftAuthUrl() {
    return this.authService.getMicrosoftAuthUrl();
  }

  @Post('microsoft/validate')
  @ApiOperation({
    summary:
      'Microsoft authentication callback. Is going to validate the Microsoft account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Microsoft account linked successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async microsoftAuthValidate(@Body() body: { code: string }, @Req() req) {
    await this.authService.linkMicrosoftAccount(req.user.id, body.code);
    return { success: true, user: req.user.name };
  }
}

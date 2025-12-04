import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

export enum ProviderType {
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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

  @Get('github/url')
  @ApiOperation({
    summary: 'GitHub authentication url handler.',
  })
  @ApiResponse({
    status: 200,
    description: 'GitHub authentication url received.',
  })
  async githubAuthUrl() {
    const client_id = process.env.GITHUB_CLIENT_ID;
    const redirect_uri = process.env.GITHUB_CALLBACK_URL;
    const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=user:email repo write:repo_hook`;
    return authorizeUrl;
  }

  @Post('github/validate')
  @ApiOperation({
    summary:
      'GitHub authentication callback. Is going to validate the GitHub account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'GitHub account linked successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async githubAuthCallback(@Body() body: { code: string }, @Req() req) {
    const userId = req.user.id;
    console.log('GitHub auth callback for user ID:', userId);
    if (!userId) throw new Error('No session found');
    console.log('Received code:', body.code);
    const access_token = await this.authService.getGithubToken(body.code);
    await this.authService.linkGithubAccount(userId, access_token);
    return { success: true, user: req.user.name };
  }

  @Get('microsoft/url')
  @ApiOperation({ summary: 'Get Microsoft authentication URL' })
  @ApiResponse({
    status: 200,
    description: 'Microsoft authentication URL retrieved successfully.',
  })
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

  @Get('discord/url')
  @ApiOperation({
    summary: 'Get Discord OAuth URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Discord OAuth URL generated successfully.',
  })
  @UseGuards(JwtSessionGuard)
  async getDiscordAuthUrl(@Req() req) {
    const userId = req.session.userId;
    const state = await this.authService.createOAuthStateToken(userId);
    const clientId = process.env.DISCORD_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUri = encodeURIComponent(`${frontendUrl}/discord/callback`);
    const scope = encodeURIComponent('identify email guilds guilds.members.read');
    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    return url;
  }

  @Get('discord/state')
  @ApiOperation({
    summary: 'Discord authentication state handler',
  })
  @ApiResponse({
    status: 200,
    description: 'Discord authentication state received.',
  })
  @UseGuards(JwtSessionGuard)
  async discordAuthState(@Req() req) {
    const userId = req.session.userId;
    const state = await this.authService.createOAuthStateToken(userId);
    return state;
  }

  @Post('discord/validate')
  @ApiOperation({
    summary:
      'Discord authentication callback. Validates the code and links the Discord account to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Discord account linked successfully.',
  })
  async discordAuthCallback(
    @Body() body: { code: string; state: string }
  ) {
    try {
      const { code, state } = body;
      const userId = await this.authService.validateOAuthState(state);
      console.log('Discord auth callback for user ID:', userId);
      if (!userId) throw new Error('Invalid or expired state token');
      const access_token = await this.authService.getDiscordToken(code);
      await this.authService.linkDiscordAccount(userId, access_token);
      return { success: true, message: 'Discord account linked successfully' };
    } catch (error) {
      console.error('Discord auth callback error:', error);
      throw error;
    }
  }
}

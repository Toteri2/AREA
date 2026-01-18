import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully registered.',
  })
  @ApiResponse({
    status: 409,
    description: 'Credentials already in use.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  async register(
    @Body() body: { email: string; password: string; name: string },
    @Res() res
  ) {
    try {
      if (!body.email || !body.password || !body.name) {
        throw new BadRequestException('Email, password, and name are required');
      }

      const user = await this.authService.register(
        body.email,
        body.password,
        body.name
      );
      const token = await this.authService.login(user);
      return res.status(HttpStatus.CREATED).send({
        id: user.id,
        email: user.email,
        name: user.name,
        token: token.access_token,
      });
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Credentials already in use');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error('Registration error:', error);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged in.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  async login(@Body() body: { email: string; password: string }, @Res() res) {
    try {
      if (!body.email || !body.password) {
        throw new BadRequestException('Email and password are required');
      }

      const user = await this.authService.validateUser(
        body.email,
        body.password
      );
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const token = await this.authService.login(user);
      return res.status(HttpStatus.OK).send(token);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Login error:', error);
      throw new InternalServerErrorException('Failed to login');
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the profile of the logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'The user profile has been successfully retrieved.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    const userId = req.user.id;
    return { id: userId, email: req.user.email, name: req.user.name };
  }

  @Get('github/url')
  @ApiOperation({
    summary: 'GitHub authentication url handler.',
  })
  @ApiResponse({
    status: 200,
    description: 'GitHub authentication url received.',
  })
  async githubAuthUrl(@Query('mobile') mobile: string) {
    const clientId = this.configService.getOrThrow<string>('GITHUB_CLIENT_ID');
    const redirectUri = this.configService.getOrThrow<string>(
      'GITHUB_CALLBACK_URL'
    );

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email repo write:repo_hook&state=${state}`;
  }

  @Post('github/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'GitHub authentication callback. Is going to validate the GitHub account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'GitHub account linked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code or missing session.',
  })
  @UseGuards(AuthGuard('jwt'))
  async githubAuthCallback(@Body() body: { code: string }, @Req() req) {
    try {
      const userId = req.user.id;
      if (!body.code) {
        throw new BadRequestException('Authorization code is required');
      }

      const accessToken = await this.authService.getGithubToken(body.code);
      await this.authService.linkGithubAccount(userId, accessToken);
      return { success: true, user: req.user.name };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('GitHub auth error:', error);
      throw new InternalServerErrorException('Failed to link GitHub account');
    }
  }

  @Get('microsoft/url')
  @ApiOperation({ summary: 'Get Microsoft authentication URL' })
  @ApiResponse({
    status: 200,
    description: 'Microsoft authentication URL retrieved successfully.',
  })
  async microsoftAuthUrl(@Query('mobile') mobile: string) {
    const clientId = this.configService.getOrThrow<string>(
      'MICROSOFT_CLIENT_ID'
    );
    const redirectUri = this.configService.getOrThrow<string>(
      'MICROSOFT_CALLBACK_URL'
    );

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=offline_access https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite&state=${state}`;
  }

  @Post('microsoft/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Microsoft authentication callback. Is going to validate the Microsoft account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Microsoft account linked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code.',
  })
  @UseGuards(AuthGuard('jwt'))
  async microsoftAuthValidate(@Body() body: { code: string }, @Req() req) {
    try {
      const userId = req.user.id;
      if (!body.code) {
        throw new BadRequestException('Authorization code is required');
      }

      await this.authService.linkMicrosoftAccount(userId, body.code);
      return { success: true, user: req.user.name };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Microsoft auth error:', error);
      throw new InternalServerErrorException(
        'Failed to link Microsoft account'
      );
    }
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
    const state = await this.authService.createOAuthStateToken(
      userId,
      ProviderType.DISCORD
    );
    const clientId = this.configService.getOrThrow<string>('DISCORD_CLIENT_ID');
    const discordAuthCallbackUrl = this.configService.getOrThrow<string>(
      'DISCORD_CALLBACK_URL'
    );
    const redirectUri = encodeURIComponent(discordAuthCallbackUrl);
    const scope = encodeURIComponent('identify guilds bot messages.read');
    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&permissions=805375056`;
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
    const state = await this.authService.createOAuthStateToken(
      userId,
      ProviderType.DISCORD
    );
    return state;
  }

  @Post('discord/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Discord authentication callback. Validates the code and links the Discord account to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Discord account linked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code or state.',
  })
  async discordAuthCallback(@Body() body: { code: string; state: string }) {
    try {
      const { code, state } = body;
      if (!code || !state) {
        throw new BadRequestException('Code and state are required');
      }

      const userId = await this.authService.validateOAuthState(
        state,
        ProviderType.DISCORD
      );
      if (!userId) {
        throw new UnauthorizedException('Invalid or expired state token');
      }

      const accessToken = await this.authService.getDiscordToken(code);
      await this.authService.linkDiscordAccount(userId, accessToken);
      return { success: true, message: 'Discord account linked successfully' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error('Discord auth callback error:', error);
      throw new InternalServerErrorException('Failed to link Discord account');
    }
  }

  @Get('twitch/url')
  @ApiOperation({
    summary: 'Get Twitch OAuth URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Twitch OAuth URL generated successfully.',
  })
  @UseGuards(JwtSessionGuard)
  async getTwitchAuthUrl(@Req() req) {
    const userId = req.session.userId;
    const state = await this.authService.createOAuthStateToken(
      userId,
      ProviderType.TWITCH
    );
    const clientId = this.configService.getOrThrow<string>('TWITCH_CLIENT_ID');
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const redirectUri = encodeURIComponent(`${frontendUrl}/twitch/callback`);
    const scope = encodeURIComponent(
      'user:read:email moderator:read:followers channel:read:subscriptions'
    );
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&force_verify=true`;
    return url;
  }

  @Post('twitch/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Twitch authentication callback. Validates the code and links the Twitch account to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Twitch account linked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code or state.',
  })
  async twitchAuthCallback(@Body() body: { code: string; state: string }) {
    try {
      const { code, state } = body;
      if (!code || !state) {
        throw new BadRequestException('Code and state are required');
      }

      const userId = await this.authService.validateOAuthState(
        state,
        ProviderType.TWITCH
      );
      if (!userId) {
        throw new UnauthorizedException('Invalid or expired state token');
      }

      const accessToken = await this.authService.getTwitchToken(code);
      await this.authService.linkTwitchAccount(userId, accessToken);
      return { success: true, message: 'Twitch account linked successfully' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error('Twitch auth callback error:', error);
      throw new InternalServerErrorException('Failed to link Twitch account');
    }
  }
  @Get('gmail/url')
  @ApiOperation({
    summary: 'Gmail authentication url handler.',
  })
  @ApiResponse({
    status: 200,
    description: 'Gmail authentication url received.',
  })
  async gmailAuthUrl(@Query('mobile') mobile: string) {
    const clientId = this.configService.getOrThrow<string>('GMAIL_CLIENT_ID');
    const redirectUri =
      this.configService.getOrThrow<string>('GMAIL_CALLBACK_URL');

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/gmail.modify&state=${state}&prompt=consent&access_type=offline`;
    return url;
  }

  @Post('gmail/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Gmail authentication callback. Is going to validate the Gmail account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Gmail account linked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code or missing session.',
  })
  @UseGuards(AuthGuard('jwt'))
  async gmailAuthCallback(@Body() body: { code: string }, @Req() req) {
    try {
      const userId = req.user.id;
      if (!body.code) {
        throw new BadRequestException('Authorization code is required');
      }

      const { accessToken, refreshToken } =
        await this.authService.getGmailToken(body.code);
      await this.authService.linkGmailAccount(
        userId,
        accessToken,
        refreshToken
      );
      return { success: true, user: req.user.name };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Gmail auth error:', error);
      throw new InternalServerErrorException('Failed to link Gmail account');
    }
  }

  @Get('google/url')
  @ApiOperation({
    summary: 'Google authentication url handler for login/register.',
  })
  @ApiResponse({
    status: 200,
    description: 'Google authentication url received.',
  })
  async googleAuthUrl(@Query('mobile') mobile: string) {
    const clientId = this.configService.getOrThrow<string>('GMAIL_CLIENT_ID');
    const redirectUri = this.configService.getOrThrow<string>(
      'GOOGLE_CALLBACK_URL'
    );

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const scope = encodeURIComponent('email profile');

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
  }

  @Post('google/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Google authentication callback. Authenticates or registers the user via Google OAuth',
  })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code.',
  })
  @ApiResponse({
    status: 409,
    description: 'Account with this email already exists.',
  })
  async googleAuthCallback(@Body() body: { code: string }, @Res() res) {
    try {
      if (!body.code) {
        throw new BadRequestException('Authorization code is required');
      }

      const { accessToken, email, name } =
        await this.authService.getGoogleUserInfo(body.code);
      const user = await this.authService.findOrCreateGoogleUser(
        email,
        name,
        accessToken
      );
      const token = await this.authService.login(user);
      return res.status(HttpStatus.OK).send(token);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error?.message?.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      console.error('Google auth error:', error);
      throw new InternalServerErrorException(
        'Failed to authenticate with Google'
      );
    }
  }

  @Get('jira/url')
  @ApiOperation({
    summary: 'Jira authentication url handler.',
  })
  @ApiResponse({
    status: 200,
    description: 'Jira authentication url received.',
  })
  async jiraAuthUrl(@Query('mobile') mobile: string) {
    const clientId = this.configService.getOrThrow<string>('JIRA_CLIENT_ID');
    const redirectUri =
      this.configService.getOrThrow<string>('JIRA_CALLBACK_URL');

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const scope = encodeURIComponent(
      'read:jira-work write:jira-work read:jira-user manage:jira-webhook offline_access'
    );
    const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}&response_type=code&prompt=consent`;
    return url;
  }

  @Post('jira/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Jira authentication callback. Is going to validate the Jira account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Jira account linked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code or missing session.',
  })
  @UseGuards(AuthGuard('jwt'))
  async jiraAuthCallback(@Body() body: { code: string }, @Req() req) {
    try {
      const userId = req.user.id;
      if (!body.code) {
        throw new BadRequestException('Authorization code is required');
      }

      let code = body.code;

      if (code.includes('code=')) {
        const match = code.match(/code=([^&]+)/);
        if (match) {
          code = decodeURIComponent(match[1]);
        }
      }

      const { accessToken, refreshToken } =
        await this.authService.getJiraToken(code);
      const cloudId = await this.authService.getJiraCloudId(accessToken);

      await this.authService.linkJiraAccount(
        userId,
        accessToken,
        refreshToken,
        cloudId
      );

      return { success: true, user: req.user.name };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Jira auth error:', error);
      throw new InternalServerErrorException('Failed to link Jira account');
    }
  }
}

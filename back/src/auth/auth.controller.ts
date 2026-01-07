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
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { AuthService } from './auth.service';

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
    @Res() res,
  ) {
    try {
      const user = await this.authService.register(
        body.email,
        body.password,
        body.name,
      );
      const token = await this.authService.login(user);
      return res.status(201).send({
        id: user.id,
        email: user.email,
        name: user.name,
        token: token.access_token,
      });
    } catch (error) {
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
  async githubAuthUrl(@Query('mobile') mobile: string) {
    const client_id = process.env.GITHUB_CLIENT_ID;
    const redirect_uri = process.env.GITHUB_CALLBACK_URL;

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    return `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=user:email repo write:repo_hook&state=${state}`;
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
    if (!userId) throw new Error('No session found');
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
  async microsoftAuthUrl(@Query('mobile') mobile: string) {
    const client_id = process.env.MICROSOFT_CLIENT_ID;
    const redirect_uri = process.env.MICROSOFT_CALLBACK_URL;

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&response_mode=query&scope=offline_access user.read mail.read&state=${state}`;
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
    const state = await this.authService.createOAuthStateToken(
      userId,
      ProviderType.DISCORD,
    );
    const clientId = process.env.DISCORD_CLIENT_ID;
    const discordAuthCallbackUrl = process.env.DISCORD_CALLBACK_URL || '';
    const redirectUri = encodeURIComponent(discordAuthCallbackUrl);
    const scope = encodeURIComponent(
      'identify email guilds guilds.members.read',
    );
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
    const state = await this.authService.createOAuthStateToken(
      userId,
      ProviderType.DISCORD,
    );
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
  async discordAuthCallback(@Body() body: { code: string; state: string }) {
    try {
      const { code, state } = body;
      const userId = await this.authService.validateOAuthState(
        state,
        ProviderType.DISCORD,
      );
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
  @Get('gmail/url')
  @ApiOperation({
    summary: 'Gmail authentication url handler.',
  })
  @ApiResponse({
    status: 200,
    description: 'Gmail authentication url received.',
  })
  async gmailAuthUrl(@Query('mobile') mobile: string) {
    const client_id = process.env.GMAIL_CLIENT_ID;
    const redirect_uri = process.env.GMAIL_CALLBACK_URL;

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=https://www.googleapis.com/auth/gmail.modify&state=${state}&prompt=consent&access_type=offline`;
    return url;
  }

  @Post('gmail/validate')
  @ApiOperation({
    summary:
      'Gmail authentication callback. Is going to validate the Gmail account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Gmail account linked successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async gmailAuthCallback(@Body() body: { code: string }, @Req() req) {
    const userId = req.user.id;
    if (!userId) throw new Error('No session found');
    const { accessToken, refreshToken } = await this.authService.getGmailToken(
      body.code,
    );
    await this.authService.linkGmailAccount(userId, accessToken, refreshToken);
    return { success: true, user: req.user.name };
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
    const client_id = process.env.JIRA_CLIENT_ID;
    const redirect_uri = process.env.JIRA_CALLBACK_URL;

    const stateData = {
      platform: mobile === 'true' ? 'mobile' : 'web',
      nonce: Math.random().toString(36).substring(7),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const scope = encodeURIComponent(
      'read:jira-work write:jira-work read:jira-user manage:jira-webhook offline_access',
    );
    const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&state=${state}&response_type=code&prompt=consent`;
    return url;
  }

  @Post('jira/validate')
  @ApiOperation({
    summary:
      'Jira authentication callback. Is going to validate the Jira account and link it to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Jira account linked successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async jiraAuthCallback(@Body() body: { code: string }, @Req() req) {
    const userId = req.user.id;
    if (!userId) throw new Error('No session found');

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
      cloudId,
    );

    return { success: true, user: req.user.name };
  }
}

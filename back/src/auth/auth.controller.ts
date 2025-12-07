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
      const token = await this.authService.login(user);
      return res.status(201).send({
        id: user.id,
        email: user.email,
        name: user.name,
        token: token.access_token,
      });
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
}

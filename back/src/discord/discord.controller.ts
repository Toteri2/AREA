import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { DiscordService } from './discord.service';
import { DiscordWebhookService } from './discord-webhook.service';
import {
  AddRoleDto,
  CreatePrivateChannelDto,
  SendMessageDto,
} from './dto/discord.dto';

@ApiTags('discord')
@Controller('discord')
export class DiscordController {
  private readonly logger = new Logger(DiscordController.name);

  constructor(
    private readonly discordService: DiscordService,
    private readonly authService: AuthService,
    private readonly webhookService: DiscordWebhookService
  ) {}

  @Get('guilds')
  @ApiOperation({ summary: 'List user Discord guilds/servers' })
  @ApiResponse({
    status: 200,
    description: 'List of guilds retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listGuilds(@Req() req) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.listUserGuilds(provider.accessToken);
  }

  @Get('guilds/:guildId/channels')
  @ApiOperation({ summary: 'List channels in a Discord guild' })
  @ApiResponse({
    status: 200,
    description: 'List of channels retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listGuildChannels(@Req() req, @Param('guildId') guildId: string) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.listGuildChannels(provider.accessToken, guildId);
  }

  @Get('guilds/:guildId/members')
  @ApiOperation({ summary: 'List members of a Discord guild' })
  @ApiResponse({
    status: 200,
    description: 'List of members retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listGuildMembers(@Req() req, @Param('guildId') guildId: string) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.getGuildMembers(provider.accessToken, guildId);
  }

  @Get('guilds/:guildId/roles')
  @ApiOperation({ summary: 'List roles in a Discord guild' })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listGuildRoles(@Req() req, @Param('guildId') guildId: string) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.listGuildRoles(provider.accessToken, guildId);
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Get recent messages from a Discord channel' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getChannelMessages(@Req() req, @Param('channelId') channelId: string) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.getChannelMessages(
      provider.accessToken,
      channelId
    );
  }

  @Get('channels/:channelId/messages/:messageId')
  @ApiOperation({ summary: 'Get a specific message with reactions' })
  @ApiResponse({
    status: 200,
    description: 'Message retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getMessage(
    @Req() req,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string
  ) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.getMessageReactions(
      provider.accessToken,
      channelId,
      messageId
    );
  }

  @Post('send-message')
  @ApiOperation({ summary: 'Send a message to a Discord channel' })
  @ApiResponse({
    status: 201,
    description: 'The message has been successfully sent.',
  })
  @UseGuards(AuthGuard('jwt'))
  async sendMessage(@Req() req, @Body() sendMessageDto: SendMessageDto) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.sendMessage(
      provider.accessToken,
      sendMessageDto
    );
  }

  @Post('add-role')
  @ApiOperation({ summary: 'Add a role to a user in a Discord server' })
  @ApiResponse({
    status: 201,
    description: 'The role has been successfully added.',
  })
  @UseGuards(AuthGuard('jwt'))
  async addRoleToUser(@Req() req, @Body() addRoleDto: AddRoleDto) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.addRoleToUser(provider.accessToken, addRoleDto);
  }

  @Post('create-channel')
  @ApiOperation({ summary: 'Create a private channel in a Discord server' })
  @ApiResponse({
    status: 201,
    description: 'The channel has been successfully created.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createPrivateChannel(
    @Req() req,
    @Body() createChannelDto: CreatePrivateChannelDto
  ) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.createPrivateChannel(
      provider.accessToken,
      createChannelDto
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current Discord user information' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Req() req) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.getCurrentUser(provider.accessToken);
  }

  @Get('metadata')
  @ApiOperation({
    summary: 'Get Discord service metadata (actions and reactions)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service metadata retrieved successfully.',
  })
  async getMetadata() {
    return this.discordService.getServiceMetadata();
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Receive Discord webhook events (for real-time notifications)',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook event processed successfully.',
  })
  async handleWebhook(
    @Headers('x-signature-ed25519') signature: string,
    @Headers('x-signature-timestamp') timestamp: string,
    @Body() payload: any
  ) {
    this.logger.debug('Received Discord webhook event');

    if (signature && timestamp) {
      const isValid = this.webhookService.verifyWebhookSignature(
        signature,
        timestamp,
        JSON.stringify(payload)
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        return { error: 'Invalid signature' };
      }
    }

    if (payload.type === 1) {
      this.logger.log('Responding to Discord webhook verification ping');
      return { type: 1 };
    }

    return this.webhookService.handleWebhookEvent(payload);
  }
}

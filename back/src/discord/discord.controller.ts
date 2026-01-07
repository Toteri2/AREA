import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { DiscordService } from './discord.service';
import {
  AddRoleDto,
  CreatePrivateChannelDto,
  SendMessageDto,
  CreateDiscordWebhookDto,
} from './dto/discord.dto';

@ApiTags('discord')
@Controller('discord')
export class DiscordController {
  constructor(
    private readonly discordService: DiscordService,
    private readonly authService: AuthService,
    private readonly reactionsService: ReactionsService,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>
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

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to a Discord channel' })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async sendMessage(@Req() req, @Body() sendMessageDto: SendMessageDto) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.sendMessage(provider.accessToken, sendMessageDto);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Add a role to a user in a Discord guild' })
  @ApiResponse({
    status: 200,
    description: 'Role added successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async addRoleToUser(@Req() req, @Body() addRoleDto: AddRoleDto) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.addRoleToUser(provider.accessToken, addRoleDto);
  }

  @Post('channels')
  @ApiOperation({ summary: 'Create a private channel in a Discord guild' })
  @ApiResponse({
    status: 201,
    description: 'Channel created successfully.',
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
  @ApiOperation({ summary: 'Handle Discord webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event received successfully.',
  })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature-ed25519') signature: string,
    @Headers('x-signature-timestamp') timestamp: string
  ) {
    console.log('Discord webhook received');
    console.log('Payload:', body);

    if (body.type === 1) {
      return { type: 1 };
    }

    if (body.type === 2 || body.type === 3) {
      const hooks = await this.hooksRepository.find({
        where: { service: 'discord' },
      });

      for (const hook of hooks) {
        const reactions = await this.reactionsService.findByHookId(hook.id);

        for (const reaction of reactions) {
          try {
            await this.reactionsService.executeReaction(
              reaction,
              body,
              hook.userId
            );
          } catch (error) {
            console.error(`Failed to execute reaction ${reaction.id}:`, error);
          }
        }
      }
    }

    return { success: true };
  }

  @Post('create-webhook')
  @ApiOperation({ summary: 'Create a Discord webhook' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(
    @Req() req,
    @Body() createWebhookDto: CreateDiscordWebhookDto
  ) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');

    const result = await this.discordService.createWebhook(
      provider.accessToken,
      createWebhookDto.channelId,
      createWebhookDto.name,
      createWebhookDto.avatar
    );

    const hook = this.hooksRepository.create({
      userId: req.user.id,
      webhookId: result.id,
      service: 'discord',
    });
    const savedHook = await this.hooksRepository.save(hook);

    return { result, hookId: savedHook.id };
  }

  @Get('guilds/:guildId/webhooks')
  @ApiOperation({ summary: 'List all webhooks in a guild' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listGuildWebhooks(@Req() req, @Param('guildId') guildId: string) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.getGuildWebhooks(guildId);
  }

  @Get('channels/:channelId/webhooks')
  @ApiOperation({ summary: 'List all webhooks in a channel' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listChannelWebhooks(@Req() req, @Param('channelId') channelId: string) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');
    return this.discordService.getChannelWebhooks(channelId);
  }

  @Delete('webhooks/:webhookId')
  @ApiOperation({ summary: 'Delete a Discord webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteWebhook(@Req() req, @Param('webhookId') webhookId: string) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');

    await this.hooksRepository.delete({
      webhookId,
      userId: req.user.id,
      service: 'discord',
    });

    return this.discordService.deleteWebhook(webhookId);
  }
}

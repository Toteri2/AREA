import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
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
  CreateDiscordWebhookDto,
  CreatePrivateChannelDto,
  SendMessageDto,
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
    return this.discordService.sendMessage(
      provider.accessToken,
      sendMessageDto
    );
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

  @Get('webhook')
  @ApiOperation({ summary: 'List all webhooks for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getAllWebhooks(@Req() req) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');

    const hooks = await this.hooksRepository.find({
      where: { userId: req.user.id, service: 'discord' },
    });

    return hooks;
  }

  @Get('webhook/:hookId')
  @ApiOperation({ summary: 'Get details of a specific webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook details retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getWebhookDetails(@Req() req, @Param('hookId') hookId: number) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');

    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: req.user.id, service: 'discord' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    return hook;
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

    const guilds = await this.discordService.listUserGuilds(
      provider.accessToken
    );
    const guild = guilds.find((g: any) => g.id === createWebhookDto.guildId);

    const channels = await this.discordService.listGuildChannels(
      provider.accessToken,
      createWebhookDto.guildId
    );
    const channel = channels.find(
      (c: any) => c.id === createWebhookDto.channelId
    );

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
      additionalInfos: {
        guildName: guild?.name || 'Unknown',
        guildId: createWebhookDto.guildId,
        channelName: channel?.name || 'Unknown',
        channelId: createWebhookDto.channelId,
      },
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

  @Delete('webhooks/:hookId')
  @ApiOperation({ summary: 'Delete a Discord webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteWebhook(@Req() req, @Param('hookId') hookId: number) {
    const provider = await this.authService.getDiscordProvider(req.user.id);
    if (!provider)
      throw new UnauthorizedException('Discord account not linked');

    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: req.user.id, service: 'discord' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    await this.hooksRepository.delete({
      id: hookId,
      userId: req.user.id,
      service: 'discord',
    });

    return this.discordService.deleteWebhook(hook.webhookId);
  }
}

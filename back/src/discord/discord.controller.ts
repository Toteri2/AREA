import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
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
import { ProviderGuard, RequireProvider } from '../auth/guards/provider.guard';
import { ReactionsService } from '../reactions/reactions.service';
import { Hook } from '../shared/entities/hook.entity';
import { ProviderType } from '../shared/enums/provider.enum';
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
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async listGuilds(@Req() req) {
    return this.discordService.listUserGuilds(req.provider.accessToken);
  }

  @Get('guilds/:guildId/channels')
  @ApiOperation({ summary: 'List channels in a Discord guild' })
  @ApiResponse({
    status: 200,
    description: 'List of channels retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async listGuildChannels(@Req() req, @Param('guildId') guildId: string) {
    return this.discordService.listGuildChannels(
      req.provider.accessToken,
      guildId
    );
  }

  @Get('guilds/:guildId/members')
  @ApiOperation({ summary: 'List members of a Discord guild' })
  @ApiResponse({
    status: 200,
    description: 'List of members retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async listGuildMembers(@Req() req, @Param('guildId') guildId: string) {
    return this.discordService.getGuildMembers(
      req.provider.accessToken,
      guildId
    );
  }

  @Get('guilds/:guildId/roles')
  @ApiOperation({ summary: 'List roles in a Discord guild' })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async listGuildRoles(@Req() req, @Param('guildId') guildId: string) {
    return this.discordService.listGuildRoles(
      req.provider.accessToken,
      guildId
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current Discord user information' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async getCurrentUser(@Req() req) {
    return this.discordService.getCurrentUser(req.provider.accessToken);
  }

  @Post('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to a Discord channel' })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid message data.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async sendMessage(@Req() req, @Body() sendMessageDto: SendMessageDto) {
    try {
      return await this.discordService.sendMessage(
        req.provider.accessToken,
        sendMessageDto
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Failed to send Discord message:', error);
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  @Post('roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a role to a user in a Discord guild' })
  @ApiResponse({
    status: 200,
    description: 'Role added successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid role data.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async addRoleToUser(@Req() req, @Body() addRoleDto: AddRoleDto) {
    try {
      return await this.discordService.addRoleToUser(
        req.provider.accessToken,
        addRoleDto
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Failed to add role:', error);
      throw new InternalServerErrorException('Failed to add role to user');
    }
  }

  @Post('channels')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a private channel in a Discord guild' })
  @ApiResponse({
    status: 201,
    description: 'Channel created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid channel data.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async createPrivateChannel(
    @Req() req,
    @Body() createChannelDto: CreatePrivateChannelDto
  ) {
    try {
      return await this.discordService.createPrivateChannel(
        req.provider.accessToken,
        createChannelDto
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Failed to create channel:', error);
      throw new InternalServerErrorException(
        'Failed to create private channel'
      );
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Discord webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event received successfully.',
  })
  async handleWebhook(@Body() body: any) {
    try {

      if (body.type === 1) {
        return { type: 1 };
      }

      if (body.type === 2 || body.type === 3) {
        const hooks = await this.hooksRepository.find({
          where: { service: 'discord' },
        });

        for (const hook of hooks) {
          try {
            if (!hook.additionalInfos || !hook.additionalInfos.events) continue;
            const hookInfo = hook.additionalInfos as any;
            if (!hookInfo.events.includes(body.data.triggerType)) {
              continue;
            }
            const reactions = await this.reactionsService.findByHookId(hook.id);
            for (const reaction of reactions) {
              try {
                if ( body.data.channelId !== hookInfo.channelId ) {
                  continue;
                }
                await this.reactionsService.executeReaction(
                  reaction,
                  body,
                  hook.userId
                );
              } catch (error) {
                console.error(
                  `Failed to execute reaction ${reaction.id}:`,
                  error
                );
              }
            }
          } catch (error) {
            console.error(`Failed to process hook ${hook.id}:`, error);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Discord webhook error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process webhook');
    }
  }

  @Get('webhook')
  @ApiOperation({ summary: 'List all webhooks for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async getAllWebhooks(@Req() req) {
    const userId = req.user.id;
    const hooks = await this.hooksRepository.find({
      where: { userId: userId, service: 'discord' },
    });
    return hooks;
  }

  @Get('webhook/:hookId')
  @ApiOperation({ summary: 'Get details of a specific webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook details retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async getWebhookDetails(@Req() req, @Param('hookId') hookId: number) {
    const userId = req.user.id;
    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: userId, service: 'discord' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    return hook;
  }

  @Post('create-webhook')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Discord webhook' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook data.',
  })
  @ApiResponse({
    status: 404,
    description: 'Guild or channel not found.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async createWebhook(
    @Req() req,
    @Body() createWebhookDto: CreateDiscordWebhookDto
  ) {
    try {
      const userId = req.user.id;

      if (
        !createWebhookDto.guildId ||
        !createWebhookDto.channelId ||
        !createWebhookDto.name
      ) {
        throw new BadRequestException(
          'Guild ID, channel ID, and name are required'
        );
      }

      const guilds = await this.discordService.listUserGuilds(
        req.provider.accessToken
      );
      const guild = guilds.find((g: any) => g.id === createWebhookDto.guildId);

      const channels = await this.discordService.listGuildChannels(
        req.provider.accessToken,
        createWebhookDto.guildId
      );
      const channel = channels.find(
        (c: any) => c.id === createWebhookDto.channelId
      );

      if (!channel) {
        throw new NotFoundException('Channel not found');
      }

      const result = await this.discordService.createWebhook(
        req.provider.accessToken,
        createWebhookDto.channelId,
        createWebhookDto.name,
        createWebhookDto.avatar
      );

      const hook = this.hooksRepository.create({
        userId: userId,
        webhookId: result.id,
        service: 'discord',
        additionalInfos: {
          guildName: guild?.name || 'Unknown',
          guildId: createWebhookDto.guildId,
          channelName: channel?.name || 'Unknown',
          channelId: createWebhookDto.channelId,
          events: createWebhookDto.events,
        },
      });
      const savedHook = await this.hooksRepository.save(hook);

      return { result, hookId: savedHook.id };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Failed to create Discord webhook:', error);
      throw new InternalServerErrorException('Failed to create webhook');
    }
  }

  @Get('guilds/:guildId/webhooks')
  @ApiOperation({ summary: 'List all webhooks in a guild' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async listGuildWebhooks(@Req() req, @Param('guildId') guildId: string) {
    return this.discordService.getGuildWebhooks(guildId);
  }

  @Get('channels/:channelId/webhooks')
  @ApiOperation({ summary: 'List all webhooks in a channel' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async listChannelWebhooks(@Req() req, @Param('channelId') channelId: string) {
    return this.discordService.getChannelWebhooks(channelId);
  }

  @Delete('webhooks/:hookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a Discord webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Webhook not found.',
  })
  @UseGuards(AuthGuard('jwt'), ProviderGuard)
  @RequireProvider(ProviderType.DISCORD)
  async deleteWebhook(@Req() req, @Param('hookId') hookId: number) {
    try {
      const userId = req.user.id;

      const hook = await this.hooksRepository.findOne({
        where: { id: hookId, userId: userId, service: 'discord' },
      });

      if (!hook) {
        throw new NotFoundException('Webhook not found');
      }

      await this.hooksRepository.delete({
        id: hookId,
        userId: userId,
        service: 'discord',
      });

      await this.discordService.deleteWebhook(hook.webhookId);
      return { message: 'Webhook deleted successfully' };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Failed to delete Discord webhook:', error);
      throw new InternalServerErrorException('Failed to delete webhook');
    }
  }
}

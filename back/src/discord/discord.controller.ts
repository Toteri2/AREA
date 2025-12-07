import {
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { DiscordService } from './discord.service';

@ApiTags('discord')
@Controller('discord')
export class DiscordController {
  constructor(
    private readonly discordService: DiscordService,
    private readonly authService: AuthService
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
}

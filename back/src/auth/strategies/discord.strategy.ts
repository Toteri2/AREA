import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('DISCORD_CLIENT_ID') || '',
      clientSecret: configService.get('DISCORD_CLIENT_SECRET') || '',
      callbackURL: configService.get('DISCORD_CALLBACK_URL') || '',
      scope: ['identify', 'email', 'guilds', 'guilds.members.read'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      discordId: profile.id,
      username: profile.username,
      email: profile.email,
      accessToken,
      refreshToken,
    };
  }
}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';
import { DiscordWebhookService } from './discord-webhook.service';

@Module({
  imports: [AuthModule],
  controllers: [DiscordController],
  providers: [DiscordService, DiscordWebhookService],
  exports: [DiscordService, DiscordWebhookService],
})
export class DiscordModule {}

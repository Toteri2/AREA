import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';

@Module({
  imports: [AuthModule],
  controllers: [DiscordController],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {}

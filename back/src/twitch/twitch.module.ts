import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ReactionsModule } from '../reactions/reactions.module';
import { Hook } from '../shared/entities/hook.entity';
import { TwitchController } from './twitch.controller';
import { TwitchService } from './twitch.service';

@Module({
  imports: [AuthModule, ReactionsModule, TypeOrmModule.forFeature([Hook])],
  controllers: [TwitchController],
  providers: [TwitchService],
  exports: [TwitchService],
})
export class TwitchModule {}

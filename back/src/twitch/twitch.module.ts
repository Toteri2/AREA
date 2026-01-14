import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProviderGuard } from '../auth/guards/provider.guard';
import { ReactionsModule } from '../reactions/reactions.module';
import { Hook } from '../shared/entities/hook.entity';
import { TwitchController } from './twitch.controller';
import { TwitchService } from './twitch.service';

@Module({
  imports: [AuthModule, ReactionsModule, TypeOrmModule.forFeature([Hook])],
  controllers: [TwitchController],
  providers: [TwitchService, ProviderGuard],
  exports: [TwitchService],
})
export class TwitchModule {}

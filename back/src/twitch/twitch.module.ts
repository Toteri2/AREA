import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TwitchWebhook } from '../shared/entities/twitch-webhook.entity';
import { TwitchController } from './twitch.controller';
import { TwitchService } from './twitch.service';

@Module({
    imports: [
        AuthModule,
        TypeOrmModule.forFeature([TwitchWebhook]),
    ],
    controllers: [TwitchController],
    providers: [TwitchService],
    exports: [TwitchService],
})
export class TwitchModule { }

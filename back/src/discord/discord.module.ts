import { forwardRef, Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProviderGuard } from '../auth/guards/provider.guard';
import { ReactionsModule } from '../reactions/reactions.module';
import { Hook } from '../shared/entities/hook.entity';
import { webhookRateLimiter } from '../shared/middleware/rate-limiters';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';
import { DiscordBotService } from './discord.bot.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ReactionsModule),
    TypeOrmModule.forFeature([Hook]),
  ],
  controllers: [DiscordController],
  providers: [DiscordService, DiscordBotService, ProviderGuard],
  exports: [DiscordService, DiscordBotService],
})
export class DiscordModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(webhookRateLimiter)
      .forRoutes({ path: 'discord/create-webhook', method: RequestMethod.POST });
  }
}

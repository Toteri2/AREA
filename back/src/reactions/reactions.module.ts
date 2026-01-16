import { forwardRef, Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { DiscordModule } from 'src/discord/discord.module';
import { ReactionsController } from 'src/reactions/reactions.controller';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { Reaction } from 'src/shared/entities/reaction.entity';
import { reactionRateLimiter } from 'src/shared/middleware/rate-limiters';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => DiscordModule),
    TypeOrmModule.forFeature([Reaction, Hook]),
  ],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})

export class ReactionsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(reactionRateLimiter)
      .forRoutes({ path: 'reactions', method: RequestMethod.POST });
  }
}

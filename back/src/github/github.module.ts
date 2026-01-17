import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsModule } from 'src/reactions/reactions.module';
import { Hook } from 'src/shared/entities/hook.entity';
import { webhookRateLimiter } from 'src/shared/middleware/rate-limiters';
import { AuthModule } from '../auth/auth.module';
import { ProviderGuard } from '../auth/guards/provider.guard';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Hook]), ReactionsModule],
  controllers: [GithubController],
  providers: [GithubService, ProviderGuard],
})
export class GithubModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(webhookRateLimiter)
      .forRoutes({ path: 'github/create-webhook', method: RequestMethod.POST });
  }
}

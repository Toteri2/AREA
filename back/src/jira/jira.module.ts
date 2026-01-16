import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProviderGuard } from '../auth/guards/provider.guard';
import { ReactionsModule } from '../reactions/reactions.module';
import { Hook } from '../shared/entities/hook.entity';
import { OAuthState } from '../shared/entities/oauthstates.entity';
import { Provider } from '../shared/entities/provider.entity';
import { User } from '../shared/entities/user.entity';
import { webhookRateLimiter } from '../shared/middleware/rate-limiters';
import { JiraController } from './jira.controller';
import { JiraService } from './jira.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, User, OAuthState, Hook]),
    AuthModule,
    ReactionsModule,
  ],
  controllers: [JiraController],
  providers: [JiraService, ProviderGuard],
  exports: [JiraService],
})
export class JiraModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(webhookRateLimiter)
      .forRoutes({ path: 'jira/create-webhook', method: RequestMethod.POST });
  }
}

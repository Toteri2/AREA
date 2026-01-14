import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProviderGuard } from '../auth/guards/provider.guard';
import { ReactionsModule } from '../reactions/reactions.module';
import { Hook } from '../shared/entities/hook.entity';
import { OAuthState } from '../shared/entities/oauthstates.entity';
import { Provider } from '../shared/entities/provider.entity';
import { User } from '../shared/entities/user.entity';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, User, OAuthState, Hook]),
    AuthModule,
    ReactionsModule,
  ],
  controllers: [GmailController],
  providers: [GmailService, ProviderGuard],
  exports: [GmailService],
})
export class GmailModule {}

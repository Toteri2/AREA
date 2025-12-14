import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { AuthModule } from '../auth/auth.module';
import { Provider } from '../shared/entities/provider.entity';
import { User } from '../shared/entities/user.entity';
import { OAuthState } from '../shared/entities/oauthstates.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, User, OAuthState]),
    AuthModule,
  ],
  controllers: [GmailController],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}

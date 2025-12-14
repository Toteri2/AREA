import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OAuthState } from '../shared/entities/oauthstates.entity';
import { Provider } from '../shared/entities/provider.entity';
import { User } from '../shared/entities/user.entity';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, User, OAuthState]), AuthModule],
  controllers: [GmailController],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}

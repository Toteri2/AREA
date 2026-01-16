import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthState } from 'src/shared/entities/oauthstates.entity';
import { Provider } from 'src/shared/entities/provider.entity';
import { User } from 'src/shared/entities/user.entity';
import { authRateLimiter, webhookRateLimiter } from 'src/shared/middleware/rate-limiters';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, Provider, OAuthState]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})

export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authRateLimiter)
      .forRoutes({ path: 'auth/register', method: RequestMethod.POST });

    consumer
      .apply(webhookRateLimiter)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST });
  }
}

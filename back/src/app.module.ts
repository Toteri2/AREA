import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DiscordModule } from './discord/discord.module';
import { GithubModule } from './github/github.module';
import { MicrosoftModule } from './microsoft/microsoft.module';
import { ReactionsModule } from './reactions/reactions.module';
import { UserModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        ({
          type: configService.get('DB_TYPE'),
          host: configService.get('DB_HOST'),
          port: +configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
        }) as TypeOrmModuleOptions,
      inject: [ConfigService],
    }),
    UserModule,
    GithubModule,
    DiscordModule,
    AuthModule,
    MicrosoftModule,
    ReactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

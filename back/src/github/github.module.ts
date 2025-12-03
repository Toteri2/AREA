import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsModule } from 'src/reactions/reactions.module';
import { Hook } from 'src/users/entities/hook.entity';
import { AuthModule } from '../auth/auth.module';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Hook]), ReactionsModule],
  controllers: [GithubController],
  providers: [GithubService],
})
export class GithubModule {}

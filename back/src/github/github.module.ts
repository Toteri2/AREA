import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

@Module({
  imports: [AuthModule],
  controllers: [GithubController],
  providers: [GithubService],
})
export class GithubModule {}

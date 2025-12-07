import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ReactionsModule } from 'src/reactions/reactions.module';
import { Hook } from 'src/shared/entities/hook.entity';
import { MicrosoftController } from './microsoft.controller';
import { MicrosoftService } from './microsoft.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Hook]), ReactionsModule],
  controllers: [MicrosoftController],
  providers: [MicrosoftService],
})
export class MicrosoftModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Hook } from 'src/users/entities/hook.entity';
import { MicrosoftController } from './microsoft.controller';
import { MicrosoftService } from './microsoft.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Hook])],
  controllers: [MicrosoftController],
  providers: [MicrosoftService],
})
export class MicrosoftModule {}

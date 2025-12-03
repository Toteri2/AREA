import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ReactionsController } from 'src/reactions/reactions.controller';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/users/entities/hook.entity';
import { Reaction } from 'src/users/entities/reaction.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Reaction, Hook])],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}

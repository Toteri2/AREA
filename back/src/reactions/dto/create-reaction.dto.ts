import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject } from 'class-validator';
import { ReactionType } from 'src/users/entities/reaction.entity';

export class CreateReactionDto {
  @ApiProperty({
    description: 'ID of the webhook/hook to attach this reaction to',
    example: 1,
  })
  @IsNumber()
  hookId: number;

  @ApiProperty({
    description: 'Type of reaction to execute',
    enum: ReactionType,
    example: ReactionType.SEND_EMAIL_OUTLOOK,
  })
  @IsEnum(ReactionType)
  reactionType: ReactionType;

  @ApiProperty({
    description: 'Configuration for the reaction (email, subject, body, etc.)',
    example: {
      to: 'user@example.com',
      subject: 'New issue on {{repo}}',
      body: 'New issure created !',
    },
  })
  @IsObject()
  config: Record<string, any>;
}

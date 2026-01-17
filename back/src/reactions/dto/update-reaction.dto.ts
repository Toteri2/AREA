import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ReactionType } from 'src/shared/entities/reaction.entity';

export class UpdateReactionDto {
  @ApiProperty({
    description: 'Name of the reaction',
    example: 'Send email on new issue',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Type of reaction to execute',
    enum: ReactionType,
    example: ReactionType.SEND_EMAIL_OUTLOOK,
    required: false,
  })
  @IsEnum(ReactionType)
  @IsOptional()
  reactionType?: ReactionType;

  @ApiProperty({
    description: 'Configuration for the reaction (email, subject, body, etc.)',
    example: {
      to: 'thomas@example.com',
      subject: 'New issue on {{repo}}',
      body: 'New issue created !',
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

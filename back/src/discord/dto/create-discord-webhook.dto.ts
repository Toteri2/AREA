import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateDiscordWebhookDto {
  @IsString()
  @ApiProperty({ description: 'The ID of the guild (server)' })
  guildId: string;

  @IsString()
  @ApiProperty({ description: 'The ID of the channel where the webhook will be created' })
  channelId: string;

  @IsString()
  @ApiProperty({ description: 'The name of the webhook' })
  name: string;

  @IsArray()
  @ApiProperty({
    description: 'The events to subscribe to (e.g., message, member_join, etc.)',
    type: [String],
  })
  events: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Optional avatar URL for the webhook', required: false })
  avatar?: string;
}

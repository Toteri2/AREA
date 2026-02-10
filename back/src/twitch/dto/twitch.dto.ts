import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTwitchWebhookDto {
  @ApiProperty({ description: 'Broadcaster user ID to monitor' })
  @IsString()
  @IsNotEmpty()
  broadcasterUserId: string;

  @ApiProperty({ description: 'Event type to subscribe to' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({
    description: 'Webhook secret for signature verification',
    required: false,
  })
  @IsString()
  @IsOptional()
  secret?: string;
}

export class CreateClipDto {
  @ApiProperty({ description: 'Broadcaster ID to create clip from' })
  @IsString()
  @IsNotEmpty()
  broadcasterId: string;
}

export class SendChatMessageDto {
  @ApiProperty({ description: 'Broadcaster channel ID to send message to' })
  @IsString()
  @IsNotEmpty()
  broadcasterId: string;

  @ApiProperty({ description: 'Message to send' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateStreamDto {
  @ApiProperty({ description: 'Stream title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Game/Category ID', required: false })
  @IsString()
  @IsOptional()
  gameId?: string;

  @ApiProperty({
    description: 'Broadcaster language (ISO 639-1)',
    required: false,
  })
  @IsString()
  @IsOptional()
  broadcasterLanguage?: string;
}

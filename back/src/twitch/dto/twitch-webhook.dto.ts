import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTwitchWebhookDto {
  @ApiProperty({
    description: 'Broadcaster user ID to monitor',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  broadcasterUserId: string;

  @ApiProperty({
    description:
      'Event type to subscribe to (stream.online, stream.offline, channel.update, channel.follow)',
    example: 'stream.online',
  })
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

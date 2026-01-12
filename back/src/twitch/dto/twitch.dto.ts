import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

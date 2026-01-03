import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateGmailDto {
  @IsString()
  @ApiProperty({
    description: 'The Pub/Sub topic to publish notifications to',
    example: 'projects/my-project/topics/gmail-notifications',
  })
  topicName: string;

  @IsInt()
  @ApiProperty({
    description: 'The type of Gmail events to subscribe to',
    example: 1,
    enum: [1, 2],
  })
  eventType: number;
}

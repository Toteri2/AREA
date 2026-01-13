import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateGmailDto {
  @IsInt()
  @ApiProperty({
    description: 'The type of Gmail events to subscribe to',
    example: 1,
    enum: [1, 2, 3],
  })
  eventType: number;
}

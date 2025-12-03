import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class CreateMicrosoftDto {
  @IsArray()
  @ApiProperty({ description: 'The change types for the subscription' })
  changeType: string[];

  @IsString()
  @ApiProperty({ description: 'The resource to subscribe to' })
  resource: string;
}

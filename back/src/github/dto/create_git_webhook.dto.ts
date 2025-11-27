import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @ApiProperty({ description: 'The owner of the repository' })
  owner: string;

  @IsString()
  @ApiProperty({ description: 'The name of the repository' })
  repo: string;

  @IsArray()
  @ApiProperty({
    description: 'The events that trigger the webhook',
    type: [String],
  })
  events: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The secret for the webhook', required: false })
  secret?: string;
}

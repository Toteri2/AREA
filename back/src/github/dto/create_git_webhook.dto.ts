import { IsString, IsArray, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookDto {
  @IsString()
  @ApiProperty({ description: 'The owner of the repository' })
  owner: string;

  @IsString()
  @ApiProperty({ description: 'The name of the repository' })
  repo: string;

  @IsUrl()
  @ApiProperty({ description: 'The URL of the webhook' })
  webhookUrl: string;

  @IsArray()
  @ApiProperty({ description: 'The events that trigger the webhook', type: [String] })
  events: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The secret for the webhook', required: false })
  secret?: string;
}

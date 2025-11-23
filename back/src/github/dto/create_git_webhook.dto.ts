import { IsString, IsArray, IsOptional, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  owner: string;

  @IsString()
  repo: string;

  @IsUrl()
  webhookUrl: string;

  @IsArray()
  events: string[];

  @IsString()
  @IsOptional()
  secret?: string;
}

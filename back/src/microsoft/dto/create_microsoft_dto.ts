import { IsArray, IsString } from "class-validator";

export class CreateMicrosoftDto {
  @IsArray()
  changeType: string[];

  @IsString()
  resource: string;
}
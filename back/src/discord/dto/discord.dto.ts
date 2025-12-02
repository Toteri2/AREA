import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

/*
 DTO for the action "send_message"
*/
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The ID of the channel to send the message to' })
  channelId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The content of the message' })
  content: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'Optional embeds for the message',
    required: false,
    type: [Object],
  })
  embeds?: any[];
}

/*
 DTO for the action "add_role_to_user"
*/
export class AddRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The ID of the guild' })
  guildId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The ID of the user to add the role to' })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The ID of the role to add' })
  roleId: string;
}

/*
 DTO for the action "create_private_channel"
*/
export class CreatePrivateChannelDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The ID of the guild' })
  guildId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the channel' })
  name: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'The type of channel (0=text, 2=voice, 4=category)',
    required: false,
  })
  type?: number;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'Permission overwrites for the channel',
    required: false,
    type: [Object],
  })
  permissionOverwrites?: any[];
}

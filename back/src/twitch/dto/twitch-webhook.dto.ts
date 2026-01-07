import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateTwitchWebhookDto {
    @ApiProperty({
        description: 'Event type to subscribe to',
        example: 'stream.online'
    })
    @IsString()
    @IsNotEmpty()
    eventType: string;

    @ApiProperty({
        description: 'Condition for the subscription',
        example: { broadcaster_user_id: '123456' }
    })
    @IsObject()
    @IsNotEmpty()
    condition: any;
}

export class EventSubCallbackDto {
    @ApiProperty({ description: 'Challenge string for verification', required: false })
    @IsString()
    @IsOptional()
    challenge?: string;

    @ApiProperty({ description: 'Subscription details', required: false })
    @IsObject()
    @IsOptional()
    subscription?: any;

    @ApiProperty({ description: 'Event data', required: false })
    @IsObject()
    @IsOptional()
    event?: any;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderType } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { CreateMicrosoftDto } from 'src/microsoft/dto/create_microsoft_dto';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/users/entities/hook.entity';
import { Repository } from 'typeorm';
import { MicrosoftService } from './microsoft.service';

@Controller('microsoft')
@ApiTags('microsoft')
export class MicrosoftController {
  constructor(
    private readonly microsoftService: MicrosoftService,
    private readonly authService: AuthService,
    private readonly reactionsService: ReactionsService,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Microsoft webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event received successfully.',
  })
  async webhook(
    @Body() body: any,
    @Res() res,
    @Query('validationToken') token: string
  ) {
    if (token) {
      return res.send(token);
    }

    const oauthState = await this.authService.findOauthState(
      body.value?.[0]?.clientState,
      ProviderType.MICROSOFT
    );

    if (oauthState) {
      console.log('Microsoft webhook received:', body);

      const subscriptionId = body.value?.[0]?.subscriptionId;
      if (subscriptionId) {
        const hook = await this.hooksRepository.findOne({
          where: { webhookId: subscriptionId, service: 'microsoft' },
        });

        if (hook) {
          const reactions = await this.reactionsService.findByHookId(hook.id);

          for (const reaction of reactions) {
            try {
              await this.reactionsService.executeReaction(
                reaction,
                body,
                hook.userId
              );
            } catch (error) {
              console.error(
                `Failed to execute reaction ${reaction.id}:`,
                error
              );
            }
          }
        }
      }
    }

    return res.status(200).send();
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List user Microsoft webhooks' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listUserWebhooks(@Req() req) {
    return this.microsoftService.listUserWebhooks(
      await this.authService.getMicrosoftToken(req.user.id)
    );
  }

  @Post('alive')
  async alive() {
    return { status: 'alive' };
  }

  @Post('create-webhook')
  @ApiOperation({ summary: 'Create a Microsoft webhook' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(@Req() req, @Body() body: CreateMicrosoftDto) {
    const webhookUrl = process.env.MICROSOFT_WEBHOOK_URL ?? '';
    return this.microsoftService.createWebhook(
      body,
      await this.authService.getMicrosoftToken(req.user.id),
      webhookUrl,
      req.user.id,
      await this.authService.createOAuthStateToken(
        req.user.id,
        ProviderType.MICROSOFT
      )
    );
  }

  @Delete('webhook')
  @ApiOperation({ summary: 'Delete a Microsoft subscription' })
  @ApiResponse({
    status: 200,
    description: 'The subscription has been successfully deleted.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteSubscription(@Req() req, @Res() res, @Query('id') id: string) {
    try {
      await this.microsoftService.deleteSubscription(
        id,
        await this.authService.getMicrosoftToken(req.user.id)
      );
      return res.status(200).send({ message: 'Subscription deleted' });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return res.status(500).send({ message: 'Failed to delete subscription' });
    }
  }
}

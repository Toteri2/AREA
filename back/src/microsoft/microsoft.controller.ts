import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { CreateMicrosoftDto } from 'src/microsoft/dto/create_microsoft_dto';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { Repository } from 'typeorm';
import { MicrosoftService } from './microsoft.service';

@Controller('microsoft')
@ApiTags('microsoft')
export class MicrosoftController {
  constructor(
    private readonly microsoftService: MicrosoftService,
    private readonly authService: AuthService,
    private readonly reactionsService: ReactionsService,
    private readonly configService: ConfigService,
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
      return res.status(200).send(token);
    }

    const oauthState = await this.authService.findOauthState(
      body.value?.[0]?.clientState,
      ProviderType.MICROSOFT
    );

    if (oauthState) {
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
    const accessToken = await this.authService.getMicrosoftToken(req.user.id);
    const profile = await this.microsoftService.getProfile(accessToken);
    const email = profile?.mail;
    const webhookUrl = this.configService.getOrThrow<string>(
      'MICROSOFT_WEBHOOK_URL'
    );
    return this.microsoftService.createWebhook(
      body,
      accessToken,
      webhookUrl,
      req.user.id,
      await this.authService.createOAuthStateToken(
        req.user.id,
        ProviderType.MICROSOFT
      ),
      email
    );
  }

  @Delete('webhook')
  @ApiOperation({ summary: 'Delete a Microsoft subscription' })
  @ApiResponse({
    status: 200,
    description: 'The subscription has been successfully deleted.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteSubscription(@Req() req, @Query('id') id: number) {
    const hook = await this.hooksRepository.findOne({
      where: {
        id: id,
        userId: req.user.id,
        service: 'microsoft',
      },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    await this.microsoftService.deleteSubscription(
      hook.webhookId,
      await this.authService.getMicrosoftToken(req.user.id)
    );
    return { message: 'Subscription deleted' };
  }
}

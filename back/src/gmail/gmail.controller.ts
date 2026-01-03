import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { CreateGmailDto } from 'src/gmail/dto/create_gmail_dto';
import { ReactionsService } from 'src/reactions/reactions.service';
import { Hook } from 'src/shared/entities/hook.entity';
import { GmailEventType } from 'src/shared/enums/gmail-event.enum';
import { ProviderType } from 'src/shared/enums/provider.enum';
import { Repository } from 'typeorm';
import { GmailService } from './gmail.service';

@Controller('gmail')
@ApiTags('gmail')
export class GmailController {
  constructor(
    private readonly gmailService: GmailService,
    private readonly authService: AuthService,
    private readonly reactionsService: ReactionsService,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Gmail webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event received successfully.',
  })
  async webhook(@Body() body: any, @Res() res) {
    if (body.message?.data) {
      const decodedData = JSON.parse(
        Buffer.from(body.message.data, 'base64').toString('utf-8')
      );

      const emailAddress = decodedData.emailAddress;
      const historyId = decodedData.historyId;

      const hooks = await this.hooksRepository.find({
        where: { service: 'gmail' },
      });

      for (const hook of hooks) {
        if (hook.lastHistoryId && historyId <= hook.lastHistoryId) {
          continue;
        }

        const provider = await this.authService.getGmailProvider(hook.userId);
        if (!provider) {
          continue;
        }

        const gmailToken = await this.authService.getStoredGmailToken(
          hook.userId
        );

        if (!(await this.verifyEmailAddress(gmailToken, emailAddress))) {
          continue;
        }

        const shouldTrigger = await this.handleGmailEvent(
          hook,
          gmailToken,
          historyId
        );

        if (shouldTrigger) {
          await this.executeReactions(hook, body, emailAddress, historyId);
        }

        hook.lastHistoryId = historyId;
        await this.hooksRepository.save(hook);
      }
    }
    return res.status(200).send();
  }

  private async verifyEmailAddress(
    gmailToken: string,
    emailAddress: string
  ): Promise<boolean> {
    try {
      const profileResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        return profile.emailAddress === emailAddress;
      }
      return false;
    } catch (error) {
      console.error('Error verifying email address:', error);
      return false;
    }
  }

  private async handleGmailEvent(
    hook: Hook,
    gmailToken: string,
    historyId: string
  ): Promise<boolean> {
    const eventType = hook.eventType;

    switch (eventType) {
      case GmailEventType.MESSAGE_ADDED_INBOX:
        return this.checkMessageAddedInbox(hook, gmailToken, historyId);

      case GmailEventType.MESSAGE_ADDED:
        return this.checkMessageAdded(hook, gmailToken, historyId);

      case GmailEventType.MESSAGE_DELETED:
        return this.checkMessageDeleted(hook, gmailToken, historyId);

      default:
        console.warn(`Unknown event type: ${eventType}`);
        return false;
    }
  }

  private async checkMessageAddedInbox(
    hook: Hook,
    gmailToken: string,
    historyId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${hook.lastHistoryId || historyId}&historyTypes=messageAdded`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        return historyData.history?.some((hist: any) =>
          hist.messagesAdded?.some((msg: any) =>
            msg.message?.labelIds?.includes('INBOX')
          )
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking message added in inbox:', error);
      return false;
    }
  }

  private async checkMessageAdded(
    hook: Hook,
    gmailToken: string,
    historyId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${hook.lastHistoryId || historyId}&historyTypes=messageAdded`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        return historyData.history?.some((hist: any) => hist.messagesAdded);
      }
      return false;
    } catch (error) {
      console.error('Error checking message added:', error);
      return false;
    }
  }

  private async checkMessageDeleted(
    hook: Hook,
    gmailToken: string,
    historyId: string
  ): Promise<boolean> {
    try {
      const historyResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${hook.lastHistoryId || historyId}&historyTypes=messageDeleted`,
        {
          headers: {
            Authorization: `Bearer ${gmailToken}`,
          },
        }
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        return historyData.history?.some((hist: any) => hist.messagesDeleted);
      }
      return false;
    } catch (error) {
      console.error('Error checking message deleted:', error);
      return false;
    }
  }

  private async executeReactions(
    hook: Hook,
    body: any,
    emailAddress: string,
    historyId: string
  ): Promise<void> {
    const reactions = await this.reactionsService.findByHookId(hook.id);

    if (reactions.length > 0) {
      for (const reaction of reactions) {
        try {
          await this.reactionsService.executeReaction(
            reaction,
            { ...body, emailAddress, historyId },
            hook.userId
          );
        } catch (error) {
          console.error(`Failed to execute reaction ${reaction.id}:`, error);
        }
      }
    }
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List user Gmail webhooks' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listUserWebhooks(@Req() req) {
    return this.gmailService.listUserWebhooks(
      await this.authService.getStoredGmailToken(req.user.id)
    );
  }

  @Post('alive')
  async alive() {
    return { status: 'alive' };
  }

  @Post('create-webhook')
  @ApiOperation({ summary: 'Create a Gmail webhook' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(@Req() req, @Body() body: CreateGmailDto) {
    const provider = await this.authService.getGmailProvider(req.user.id);
    const webhookUrl = process.env.GMAIL_WEBHOOK_URL ?? '';
    if (!provider) throw new UnauthorizedException('Gmail account not linked');

    return this.gmailService.createWebhook(
      body,
      await this.authService.getStoredGmailToken(req.user.id),
      webhookUrl,
      req.user.id,
      await this.authService.createOAuthStateToken(
        req.user.id,
        ProviderType.GMAIL
      )
    );
  }

  @Delete('webhook')
  @ApiOperation({ summary: 'Delete a Gmail subscription' })
  @ApiResponse({
    status: 200,
    description: 'The subscription has been successfully deleted.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteSubscription(@Req() req, @Res() res, @Query('id') id: string) {
    try {
      await this.gmailService.deleteSubscription(
        id,
        await this.authService.getStoredGmailToken(req.user.id)
      );
      return res.status(200).send({ message: 'Subscription deleted' });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return res.status(500).send({ message: 'Failed to delete subscription' });
    }
  }
}

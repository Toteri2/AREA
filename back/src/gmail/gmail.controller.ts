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
import { Hook } from 'src/shared/entities/hook.entity';
import { Repository } from 'typeorm';
import { GmailService } from './gmail.service';

@Controller('gmail')
@ApiTags('gmail')
export class GmailController {
  constructor(
    private readonly gmailService: GmailService,
    private readonly authService: AuthService,
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

        if (!(await this.gmailService.verifyEmailAddress(gmailToken, emailAddress))) {
          continue;
        }

        const shouldTrigger = await this.gmailService.handleGmailEvent(
          hook,
          gmailToken,
          historyId
        );

        if (shouldTrigger) {
          await this.gmailService.executeReactions(hook, body, emailAddress, historyId, hook.userId);
        }

        hook.lastHistoryId = historyId;
        await this.hooksRepository.save(hook);
      }
    }
    return res.status(200).send();
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List user Gmail webhooks' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listUserWebhooks(@Req() req) {
    return this.gmailService.listUserWebhooks(req.user.id);
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
    if (!provider) throw new UnauthorizedException('Gmail account not linked');

    return this.gmailService.createWebhook(
      body,
      await this.authService.getStoredGmailToken(req.user.id),
      req.user.id
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

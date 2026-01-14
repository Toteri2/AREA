import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Gmail webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event received successfully.',
  })
  async webhook(@Body() body: any, @Res() res) {
    try {
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
          try {
            if (hook.lastHistoryId && historyId <= hook.lastHistoryId) {
              continue;
            }

            const provider = await this.authService.getGmailProvider(
              hook.userId
            );
            if (!provider) {
              continue;
            }

            const gmailToken = await this.authService.getValidGmailToken(
              hook.userId
            );

            if (
              !(await this.gmailService.verifyEmailAddress(
                gmailToken,
                emailAddress
              ))
            ) {
              continue;
            }

            const oldHistoryId = hook.lastHistoryId || historyId;

            hook.lastHistoryId = historyId;
            await this.hooksRepository.save(hook);
            const shouldTrigger = await this.gmailService.handleGmailEvent(
              hook,
              gmailToken,
              oldHistoryId
            );

            if (shouldTrigger) {
              await this.gmailService.executeReactions(
                hook,
                body,
                emailAddress,
                historyId,
                hook.userId
              );
            }
          } catch (error) {
            console.error(`Error processing hook ${hook.id}:`, error);
          }
        }
      }
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      console.error('Gmail webhook error:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ error: 'Failed to process webhook' });
    }
  }

  @Get('webhook')
  @ApiOperation({ summary: 'List user Gmail webhooks' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async listUserWebhooks(@Req() req) {
    const userId = req.user.id;
    return this.gmailService.listUserWebhooks(userId);
  }

  @Get('webhook/:hookId')
  @ApiOperation({ summary: 'Get a specific user Gmail webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook retrieved successfully.',
  })
  @UseGuards(AuthGuard('jwt'))
  async getUserWebhook(@Req() req, @Param('hookId') hookId: number) {
    const userId = req.user.id;
    return this.gmailService.getUserWebhook(userId, hookId);
  }

  @Post('create-webhook')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Gmail webhook' })
  @ApiResponse({
    status: 201,
    description: 'The webhook has been successfully created.',
  })
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(@Req() req, @Body() body: CreateGmailDto) {
    const userId = req.user.id;
    const provider = await this.authService.getGmailProvider(userId);
    if (!provider) throw new UnauthorizedException('Gmail account not linked');

    const gmailToken = await this.authService.getValidGmailToken(userId);
    const profile = await this.gmailService.getProfile(gmailToken);

    return this.gmailService.createWebhook(
      body,
      gmailToken,
      userId,
      profile?.emailAddress
    );
  }

  @Delete('webhook/:hookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a Gmail subscription' })
  @ApiResponse({
    status: 200,
    description: 'The subscription has been successfully deleted.',
  })
  @UseGuards(AuthGuard('jwt'))
  async deleteSubscription(@Req() req, @Param('hookId') hookId: number) {
    const userId = req.user.id;
    const hook = await this.hooksRepository.findOne({
      where: { id: hookId, userId: userId, service: 'gmail' },
    });

    if (!hook) {
      throw new NotFoundException('Hook not found');
    }

    await this.gmailService.deleteSubscription(
      hookId,
      await this.authService.getValidGmailToken(userId)
    );

    return { message: 'Subscription deleted' };
  }
}

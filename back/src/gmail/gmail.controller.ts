import { Controller } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(readonly _gmailService: GmailService) {}
}

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { isEmailConfigured, sendSmtpEmail, type SendEmailInput } from './smtp';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(input: SendEmailInput): Promise<void> {
    if (!isEmailConfigured()) {
      throw new InternalServerErrorException('Email service is not configured');
    }

    try {
      const info = await sendSmtpEmail(input);
      this.logger.log(`Email accepted for ${info.accepted.join(', ') || input.to}`);
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw new InternalServerErrorException('Email could not be sent');
    }
  }
}

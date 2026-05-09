import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transport: Transporter | null;
  private readonly from = process.env.MAIL_FROM ?? process.env.MAIL_USER;

  constructor() {
    const host = process.env.MAIL_HOST;
    const port = Number(process.env.MAIL_PORT ?? 465);
    const secure = process.env.MAIL_SECURE !== 'false';
    const user = process.env.MAIL_USER;
    const password = process.env.MAIL_PASSWORD;

    this.transport =
      host && user && password && this.from
        ? nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
              user,
              pass: password,
            },
          })
        : null;
  }

  async send(input: SendEmailInput): Promise<void> {
    if (!this.transport || !this.from) {
      throw new InternalServerErrorException('Email service is not configured');
    }

    try {
      const info = await this.transport.sendMail({
        from: this.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      this.logger.log(`Email accepted for ${info.accepted.join(', ') || input.to}`);
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw new InternalServerErrorException('Email could not be sent');
    }
  }
}

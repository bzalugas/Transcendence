import { Injectable, InternalServerErrorException } from '@nestjs/common';
import nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class EmailService {
  private readonly host = process.env.MAIL_HOST;
  private readonly port = Number(process.env.MAIL_PORT ?? 465);
  private readonly secure = process.env.MAIL_SECURE !== 'false';
  private readonly user = process.env.MAIL_USER;
  private readonly password = process.env.MAIL_PASSWORD;
  private readonly from = process.env.MAIL_FROM ?? process.env.MAIL_USER;

  async send(input: SendEmailInput): Promise<void> {
    if (!this.host || !this.user || !this.password || !this.from) {
      throw new InternalServerErrorException('Email service is not configured');
    }

    const transport = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: {
        user: this.user,
        pass: this.password,
      },
    });

    await transport.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }
}

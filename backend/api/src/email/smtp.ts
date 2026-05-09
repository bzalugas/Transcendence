import nodemailer, { type SentMessageInfo, type Transporter } from 'nodemailer';

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transport: Transporter | null | undefined;

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.MAIL_HOST &&
      process.env.MAIL_USER &&
      process.env.MAIL_PASSWORD &&
      getMailFrom(),
  );
}

export async function sendSmtpEmail(
  input: SendEmailInput,
): Promise<SentMessageInfo> {
  const smtpTransport = getTransport();
  const from = getMailFrom();

  if (!smtpTransport || !from) {
    throw new Error('Email service is not configured');
  }

  return smtpTransport.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

function getTransport(): Transporter | null {
  if (transport !== undefined) return transport;

  if (!isEmailConfigured()) {
    transport = null;
    return transport;
  }

  transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 465),
    secure: process.env.MAIL_SECURE !== 'false',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  return transport;
}

function getMailFrom(): string | undefined {
  return process.env.MAIL_FROM ?? process.env.MAIL_USER;
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

export interface PrivacyRequestDto {
  requestId: string;
  status: string;
  message: string;
}

export interface PrivacyConfirmationDto extends PrivacyRequestDto {
  type: 'export' | 'deletion';
}

export interface ExportPreviewDto {
  generatedAt: string;
  sections: Array<{
    label: string;
    count: number;
  }>;
}

@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async requestExport(userId: string): Promise<PrivacyRequestDto> {
    const { request, confirmationToken, userEmail } = await this.createDataRequest(
      userId,
      'export',
    );
    await this.sendDataOperationEmail({
      to: userEmail,
      title: 'Confirm your data export request',
      body: 'We received a request to export your 42 Connect data as one readable JSON file. Confirm this request to continue.',
      confirmationToken,
    });

    return {
      requestId: String(request.id),
      status: request.status,
      message: 'Your export request was received. We will email you when your JSON file is ready.',
    };
  }

  async requestDeletion(userId: string): Promise<PrivacyRequestDto> {
    const { request, confirmationToken, userEmail } = await this.createDataRequest(
      userId,
      'deletion',
    );
    await this.sendDataOperationEmail({
      to: userEmail,
      title: 'Confirm your data deletion request',
      body: 'We received a request to delete your 42 Connect data. Confirm this request only if you want deletion to continue.',
      confirmationToken,
    });

    return {
      requestId: String(request.id),
      status: request.status,
      message: 'Your deletion request was received. We will email you to confirm before deleting anything.',
    };
  }

  async confirmRequest(
    userId: string,
    token: unknown,
  ): Promise<PrivacyConfirmationDto> {
    const confirmationToken = this.normalizeConfirmationToken(token);
    const confirmationTokenHash = this.hashConfirmationToken(confirmationToken);
    const request = await this.prisma.dataRequest.findFirst({
      where: {
        userId,
        confirmationTokenHash,
      },
    });

    if (!request) {
      throw new BadRequestException('Confirmation link is invalid or expired.');
    }

    if (request.status !== 'pending') {
      return {
        requestId: String(request.id),
        type: request.type,
        status: request.status,
        message: this.getAlreadyHandledMessage(request.type, request.status),
      };
    }

    if (
      !request.confirmationExpiresAt ||
      request.confirmationExpiresAt.getTime() < Date.now()
    ) {
      await this.prisma.dataRequest.update({
        where: { id: request.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Confirmation link is invalid or expired.');
    }

    const confirmedRequest = await this.prisma.dataRequest.update({
      where: { id: request.id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    return {
      requestId: String(confirmedRequest.id),
      type: confirmedRequest.type,
      status: confirmedRequest.status,
      message:
        confirmedRequest.type === 'export'
          ? 'Your data export request is confirmed.'
          : 'Your data deletion request is confirmed.',
    };
  }

  async getLatestExportPreview(userId: string): Promise<ExportPreviewDto> {
    const [profileCount, postCount, messageCount, fileCount] = await Promise.all([
      this.prisma.profile.count({ where: { userId } }),
      this.prisma.post.count({ where: { authorId: userId } }),
      this.prisma.message.count({ where: { senderId: userId } }),
      this.prisma.fileAsset.count({ where: { ownerId: userId } }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      sections: [
        { label: 'Profile', count: profileCount },
        { label: 'Posts', count: postCount },
        { label: 'Messages', count: messageCount },
        { label: 'Files', count: fileCount },
      ],
    };
  }

  private async createDataRequest(userId: string, type: 'export' | 'deletion') {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    const confirmationToken = randomBytes(32).toString('hex');
    const confirmationTokenHash = this.hashConfirmationToken(confirmationToken);
    const confirmationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const request = await this.prisma.dataRequest.create({
      data: {
        userId,
        type,
        confirmationTokenHash,
        confirmationExpiresAt,
      },
    });

    return {
      request,
      confirmationToken,
      userEmail: user.email,
    };
  }

  private async sendDataOperationEmail(input: {
    to: string;
    title: string;
    body: string;
    confirmationToken: string;
  }): Promise<void> {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:8080';
    const confirmationLink = `${frontendUrl}/settings/privacy?token=${input.confirmationToken}`;

    await this.emailService.send({
      to: input.to,
      subject: input.title,
      text: `${input.body}\n\nConfirmation link: ${confirmationLink}\n\nThis link expires in 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${input.title}</h2>
          <p>${input.body}</p>
          <p>
            <a href="${confirmationLink}" style="display:inline-block;padding:10px 14px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">
              Confirm request
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
  }

  private normalizeConfirmationToken(token: unknown): string {
    if (typeof token !== 'string') {
      throw new BadRequestException('Confirmation token is required.');
    }

    const normalizedToken = token.trim();

    if (!normalizedToken || normalizedToken.length > 256) {
      throw new BadRequestException('Confirmation token is invalid.');
    }

    return normalizedToken;
  }

  private hashConfirmationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getAlreadyHandledMessage(
    type: 'export' | 'deletion',
    status: string,
  ): string {
    if (status === 'confirmed') {
      return type === 'export'
        ? 'Your data export request is already confirmed.'
        : 'Your data deletion request is already confirmed.';
    }

    if (status === 'completed') {
      return type === 'export'
        ? 'Your data export request is already completed.'
        : 'Your data deletion request is already completed.';
    }

    if (status === 'expired') {
      return 'This confirmation link has expired.';
    }

    if (status === 'cancelled') {
      return 'This request has been cancelled.';
    }

    return 'This request is already being processed.';
  }
}

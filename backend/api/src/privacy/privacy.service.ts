import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface PrivacyRequestDto {
  requestId: string;
  status: string;
  message: string;
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
  constructor(private readonly prisma: PrismaService) {}

  async requestExport(userId: string): Promise<PrivacyRequestDto> {
    const request = await this.createDataRequest(userId, 'export');

    return {
      requestId: String(request.id),
      status: request.status,
      message: 'Your export request was received. We will email you when your download is ready.',
    };
  }

  async requestDeletion(userId: string): Promise<PrivacyRequestDto> {
    const request = await this.createDataRequest(userId, 'deletion');

    return {
      requestId: String(request.id),
      status: request.status,
      message: 'Your deletion request was received. We will email you to confirm before deleting anything.',
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
    const confirmationToken = randomBytes(32).toString('hex');
    const confirmationTokenHash = createHash('sha256')
      .update(confirmationToken)
      .digest('hex');
    const confirmationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Placeholder: the raw token will be sent by email in the next implementation step.
    return this.prisma.dataRequest.create({
      data: {
        userId,
        type,
        confirmationTokenHash,
        confirmationExpiresAt,
      },
    });
  }
}

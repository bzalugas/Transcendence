import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { basename, join } from 'path';
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

export interface ExportDownloadDto {
  stream: ReturnType<typeof createReadStream>;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class PrivacyService {
  private readonly exportStorageDir =
    process.env.FILE_STORAGE_DIR ?? join(process.cwd(), 'uploads', 'private');

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

    if (confirmedRequest.type === 'export') {
      const completedRequest = await this.generateExportFile(
        userId,
        confirmedRequest.id,
      );

      return {
        requestId: String(completedRequest.id),
        type: completedRequest.type,
        status: completedRequest.status,
        message: 'Your data export request is confirmed and the JSON file is ready.',
      };
    }

    return this.completeDeletionRequest(userId, confirmedRequest.id);
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

  async openExportForUser(
    userId: string,
    requestId: number,
  ): Promise<ExportDownloadDto> {
    const request = await this.prisma.dataRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.type !== 'export') {
      throw new NotFoundException('Export not found');
    }

    if (request.userId !== userId) {
      throw new ForbiddenException('You cannot download this export');
    }

    if (
      request.status !== 'completed' ||
      !request.exportStorageKey ||
      !request.exportMimeType ||
      !request.exportSizeBytes
    ) {
      throw new BadRequestException('Export is not ready yet');
    }

    const storagePath = this.exportStoragePath(request.exportStorageKey);

    try {
      await access(storagePath);
    } catch {
      throw new NotFoundException('Export file not found');
    }

    return {
      stream: createReadStream(storagePath),
      fileName: `42-connect-data-export-${request.id}.json`,
      mimeType: request.exportMimeType,
      sizeBytes: request.exportSizeBytes,
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

  private async generateExportFile(userId: string, requestId: number) {
    const requestedAt = new Date();

    await this.prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: 'processing' },
    });

    const exportData = await this.buildExportData(userId, requestedAt);
    const storageKey = `data-export-${requestId}-${randomUUID()}.json`;
    const content = JSON.stringify(exportData, null, 2);
    const filePath = this.exportStoragePath(storageKey);

    await mkdir(this.exportStorageDir, { recursive: true });
    await writeFile(filePath, content, { flag: 'wx' });

    return this.prisma.dataRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        exportStorageKey: storageKey,
        exportMimeType: 'application/json',
        exportSizeBytes: Buffer.byteLength(content),
        completedAt: new Date(),
      },
    });
  }

  private async completeDeletionRequest(
    userId: string,
    requestId: number,
  ): Promise<PrivacyConfirmationDto> {
    const storageKeys = await this.collectUserStorageKeys(userId);

    await this.prisma.$transaction(async (tx) => {
      const [posts, messages] = await Promise.all([
        tx.post.findMany({
          where: { authorId: userId },
          select: { id: true },
        }),
        tx.message.findMany({
          where: { senderId: userId },
          select: { id: true },
        }),
      ]);
      const postIds = posts.map((post) => post.id);
      const messageIds = messages.map((message) => message.id);

      if (postIds.length > 0) {
        await tx.post.updateMany({
          where: { parentId: { in: postIds } },
          data: { parentId: null },
        });
        await tx.notification.deleteMany({
          where: { postId: { in: postIds } },
        });
        await tx.reaction.deleteMany({
          where: { postId: { in: postIds } },
        });
        await tx.attachment.deleteMany({
          where: { postId: { in: postIds } },
        });
      }

      if (messageIds.length > 0) {
        await tx.notification.deleteMany({
          where: { messageId: { in: messageIds } },
        });
        await tx.attachment.deleteMany({
          where: { messageId: { in: messageIds } },
        });
      }

      await tx.notification.deleteMany({ where: { userId } });
      await tx.reaction.deleteMany({ where: { userId } });
      await tx.friendRequest.deleteMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      });
      await tx.user_Interest.deleteMany({ where: { userId } });
      await tx.user_Channel.deleteMany({ where: { userId } });
      await tx.player.deleteMany({ where: { userId } });
      await tx.message.deleteMany({ where: { senderId: userId } });
      await tx.post.deleteMany({ where: { authorId: userId } });
      await tx.fileAsset.deleteMany({ where: { ownerId: userId } });
      await tx.profile.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.dataRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });
      await tx.user.delete({ where: { id: userId } });
    });

    await this.deleteStorageKeys(storageKeys);

    return {
      requestId: String(requestId),
      type: 'deletion',
      status: 'completed',
      message: 'Your account data has been deleted.',
    };
  }

  private async collectUserStorageKeys(userId: string): Promise<string[]> {
    const [files, exports] = await Promise.all([
      this.prisma.fileAsset.findMany({
        where: { ownerId: userId },
        select: { storageKey: true },
      }),
      this.prisma.dataRequest.findMany({
        where: {
          userId,
          exportStorageKey: { not: null },
        },
        select: { exportStorageKey: true },
      }),
    ]);

    return [
      ...files.map((file) => file.storageKey),
      ...exports
        .map((request) => request.exportStorageKey)
        .filter((storageKey): storageKey is string => Boolean(storageKey)),
    ];
  }

  private async deleteStorageKeys(storageKeys: string[]): Promise<void> {
    await Promise.all(
      storageKeys.map(async (storageKey) => {
        try {
          await unlink(this.exportStoragePath(storageKey));
        } catch {
          // Missing files should not block a completed account deletion.
        }
      }),
    );
  }

  private async buildExportData(userId: string, generatedAt: Date) {
    const [
      user,
      profile,
      interests,
      channels,
      friendRequestsSent,
      friendRequestsReceived,
      posts,
      messages,
      files,
      dataRequests,
    ] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          login: true,
          role: true,
          name: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          accounts: {
            select: {
              providerId: true,
              accountId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      this.prisma.profile.findUnique({
        where: { userId },
        include: {
          socials: {
            select: {
              platform: true,
              label: true,
              url: true,
            },
          },
        },
      }),
      this.prisma.user_Interest.findMany({
        where: { userId },
        select: {
          interestLvl: true,
          interest: {
            select: {
              id: true,
              name: true,
              color: true,
              imageUri: true,
              parentId: true,
            },
          },
        },
        orderBy: { interestId: 'asc' },
      }),
      this.prisma.user_Channel.findMany({
        where: { userId },
        select: {
          joinedAt: true,
          isFavorite: true,
          channel: {
            select: {
              id: true,
              interest: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { channelId: 'asc' },
      }),
      this.prisma.friendRequest.findMany({
        where: { senderId: userId },
        select: {
          id: true,
          receiverId: true,
          status: true,
          CreatedAt: true,
          UpdatedAt: true,
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.friendRequest.findMany({
        where: { receiverId: userId },
        select: {
          id: true,
          senderId: true,
          status: true,
          CreatedAt: true,
          UpdatedAt: true,
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.post.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          createdAt: true,
          content: true,
          type: true,
          parentId: true,
          channelId: true,
          reactions: {
            select: {
              id: true,
              emoji: true,
              userId: true,
            },
          },
          attachments: {
            select: {
              id: true,
              type: true,
              file: {
                select: {
                  id: true,
                  originalName: true,
                  mimeType: true,
                  sizeBytes: true,
                  category: true,
                  attachmentType: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.message.findMany({
        where: { senderId: userId },
        select: {
          id: true,
          createdAt: true,
          content: true,
          type: true,
          chatId: true,
          attachments: {
            select: {
              id: true,
              type: true,
              file: {
                select: {
                  id: true,
                  originalName: true,
                  mimeType: true,
                  sizeBytes: true,
                  category: true,
                  attachmentType: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.fileAsset.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          category: true,
          attachmentType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.dataRequest.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          status: true,
          exportMimeType: true,
          exportSizeBytes: true,
          requestedAt: true,
          confirmedAt: true,
          completedAt: true,
          cancelledAt: true,
        },
        orderBy: { requestedAt: 'asc' },
      }),
    ]);

    return {
      metadata: {
        format: '42-connect-gdpr-export',
        version: 1,
        generatedAt,
        requestedByUserId: userId,
      },
      user,
      profile,
      interests,
      channels,
      friendRequests: {
        sent: friendRequestsSent,
        received: friendRequestsReceived,
      },
      posts,
      messages,
      uploadedFiles: files,
      dataRequests,
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

  private exportStoragePath(storageKey: string): string {
    return join(this.exportStorageDir, basename(storageKey));
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

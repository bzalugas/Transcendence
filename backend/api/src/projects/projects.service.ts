import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AttachmentType, FileCategory } from '@prisma/client';
import { FilesService } from '../files/files.service';
import { PrismaService } from '../prisma/prisma.service';

export interface ProjectMessageAttachmentDto {
  id: string;
  fileId: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  type: AttachmentType;
  previewUrl: string;
  downloadUrl: string;
}

export interface ProjectMessageDto {
  id: string;
  senderId: string;
  sender: string;
  initials: string;
  avatarUrl?: string;
  text: string;
  time: string;
  daysAgo: number;
  me: boolean;
  attachments: ProjectMessageAttachmentDto[];
}

export interface ProjectDto {
  id: number;
  slug: string;
  name: string;
  color: string;
  description: string;
  messages: ProjectMessageDto[];
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async findAll(currentUserId: string): Promise<ProjectDto[]> {
    const projects = await this.prisma.project.findMany({
      include: {
        messages: {
          include: this.messageInclude(),
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return projects.map((project) => ({
      id: project.id,
      slug: project.slug,
      name: project.name,
      color: project.color,
      description: project.description,
      messages: project.messages.map((message) =>
        this.toMessageDto(message, currentUserId),
      ),
    }));
  }

  async createMessageBySlug(
    currentUserId: string,
    slug: string,
    content?: string,
    attachmentIds?: number[],
  ): Promise<ProjectMessageDto> {
    const trimmedContent = content?.trim();
    const fileAssets = await this.findAttachableFiles(currentUserId, attachmentIds);

    if (!trimmedContent && fileAssets.length === 0) {
      throw new BadRequestException('Message content or attachment is required');
    }

    const project = await this.prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.projectMessage.create({
        data: {
          projectId: project.id,
          senderId: currentUserId,
          content: trimmedContent ?? '',
          attachments: fileAssets.length
            ? {
                create: fileAssets.map((file) => ({
                  fileId: file.id,
                  type: file.attachmentType,
                })),
              }
            : undefined,
        },
        include: this.messageInclude(),
      });

      if (fileAssets.length > 0) {
        await tx.fileAsset.updateMany({
          where: {
            id: {
              in: fileAssets.map((file) => file.id),
            },
          },
          data: {
            status: 'attached',
          },
        });
      }

      return createdMessage;
    });

    return this.toMessageDto(message, currentUserId);
  }

  private messageInclude() {
    return {
      sender: {
        include: {
          profile: true,
        },
      },
      attachments: {
        include: {
          file: true,
        },
      },
    } as const;
  }

  private async findAttachableFiles(userId: string, attachmentIds?: number[]) {
    const uniqueIds = this.validateAttachmentIds(attachmentIds);

    if (uniqueIds.length === 0) return [];

    const files = await this.prisma.fileAsset.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
        ownerId: userId,
        status: 'uploaded',
      },
      include: {
        attachments: true,
      },
    });

    const orderedFiles = uniqueIds
      .map((id) => files.find((file) => file.id === id))
      .filter((file): file is NonNullable<typeof file> => Boolean(file));

    if (
      orderedFiles.length !== uniqueIds.length ||
      orderedFiles.some((file) => file.attachments.length > 0)
    ) {
      throw new BadRequestException('One or more files cannot be attached');
    }

    return orderedFiles;
  }

  private validateAttachmentIds(attachmentIds?: number[]): number[] {
    if (!attachmentIds) return [];
    if (!Array.isArray(attachmentIds)) {
      throw new BadRequestException('Message attachment ids must be a list');
    }
    if (attachmentIds.length > 4) {
      throw new BadRequestException('Only four message attachments are supported');
    }

    const uniqueIds = Array.from(new Set(attachmentIds));
    if (uniqueIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new BadRequestException('Message attachment ids are invalid');
    }

    return uniqueIds;
  }

  private toMessageDto(
    message: {
      id: number;
      senderId: string;
      content: string;
      createdAt: Date;
      sender: {
        login: string | null;
        name: string | null;
        email: string;
        image: string | null;
        profile: {
          avatarUri: string | null;
        } | null;
      };
      attachments: Array<{
        id: number;
        type: AttachmentType;
        fileId: number;
        file: {
          id: number;
          originalName: string;
          mimeType: string;
          sizeBytes: number;
          category: FileCategory;
          attachmentType: AttachmentType;
        };
      }>;
    },
    currentUserId: string,
  ): ProjectMessageDto {
    const sender = this.userDisplayName(message.sender);

    return {
      id: String(message.id),
      senderId: message.senderId,
      sender,
      initials: this.initials(sender),
      avatarUrl: message.sender.profile?.avatarUri ?? message.sender.image ?? undefined,
      text: message.content,
      time: this.relativeTime(message.createdAt),
      daysAgo: Math.floor(
        Math.max(0, Date.now() - message.createdAt.getTime()) / 86_400_000,
      ),
      me: message.senderId === currentUserId,
      attachments: message.attachments.map((attachment) => {
        const file = this.filesService.toDto(attachment.file);

        return {
          id: String(attachment.id),
          fileId: attachment.fileId,
          originalName: file.originalName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          category: file.category,
          type: attachment.type,
          previewUrl: file.previewUrl,
          downloadUrl: file.downloadUrl,
        };
      }),
    };
  }

  private userDisplayName(user: {
    login: string | null;
    name: string | null;
    email: string;
    profile?: ({ pseudo?: string | null } & Record<string, unknown>) | null;
  }): string {
    return user.profile?.pseudo ?? user.login ?? user.name ?? user.email.split('@')[0];
  }

  private initials(value: string): string {
    const parts = value
      .trim()
      .split(/[\s._-]+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toLowerCase();
    }

    return value.slice(0, 2).toLowerCase();
  }

  private relativeTime(date: Date): string {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (elapsedSeconds < 60) return 'just now';

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) return `${elapsedDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AttachmentType, FileAsset, FileCategory } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import type { FileAssetDto, UploadedMemoryFile } from './files.types';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;

type DetectedFile = {
  mimeType: string;
  extension: string;
  category: FileCategory;
  attachmentType: AttachmentType;
  maxBytes: number;
};

@Injectable()
export class FilesService {
  private readonly storageDir =
    process.env.FILE_STORAGE_DIR ?? join(process.cwd(), 'uploads', 'private');

  constructor(private readonly prisma: PrismaService) {}

  async createForUser(userId: string, file?: UploadedMemoryFile): Promise<FileAssetDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const detected = this.detectFile(file);
    if (file.size > detected.maxBytes) {
      throw new BadRequestException(
        `File is too large. Maximum size is ${Math.floor(detected.maxBytes / 1024 / 1024)}MB`,
      );
    }

    const storageKey = `${randomUUID()}${detected.extension}`;
    const originalName = this.cleanOriginalName(file.originalname);

    await mkdir(this.storageDir, { recursive: true });
    await writeFile(this.storagePath(storageKey), file.buffer, { flag: 'wx' });

    const asset = await this.prisma.fileAsset.create({
      data: {
        ownerId: userId,
        storageKey,
        originalName,
        mimeType: detected.mimeType,
        sizeBytes: file.size,
        category: detected.category,
        attachmentType: detected.attachmentType,
      },
    });

    return this.toDto(asset);
  }

  async findMetadataForUser(userId: string, fileId: number): Promise<FileAssetDto> {
    const asset = await this.findViewableAsset(userId, fileId);
    return this.toDto(asset);
  }

  async openForUser(
    userId: string,
    fileId: number,
    mode: 'preview' | 'download',
  ): Promise<{
    asset: FileAsset;
    stream: ReturnType<typeof createReadStream>;
    disposition: 'inline' | 'attachment';
  }> {
    const asset = await this.findViewableAsset(userId, fileId);
    const disposition = mode === 'preview' && this.canPreview(asset) ? 'inline' : 'attachment';

    return {
      asset,
      stream: createReadStream(this.storagePath(asset.storageKey)),
      disposition,
    };
  }

  async deleteForUser(userId: string, fileId: number): Promise<{ deleted: true }> {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id: fileId },
      include: {
        attachments: true,
      },
    });

    if (!asset || asset.status === 'deleted') {
      throw new NotFoundException('File not found');
    }

    if (asset.ownerId !== userId) {
      throw new ForbiddenException('Only the file owner can delete it');
    }

    await this.prisma.fileAsset.delete({
      where: { id: fileId },
    });
    await this.deleteStorageKeys([asset.storageKey]);

    return { deleted: true };
  }

  async deleteStorageKeys(storageKeys: string[]): Promise<void> {
    await Promise.all(
      storageKeys.map(async (storageKey) => {
        try {
          await unlink(this.storagePath(storageKey));
        } catch {
          // Missing files should not block DB cleanup.
        }
      }),
    );
  }

  toDto(asset: Pick<FileAsset, 'id' | 'originalName' | 'mimeType' | 'sizeBytes' | 'category' | 'attachmentType'>): FileAssetDto {
    return {
      id: asset.id,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      category: asset.category,
      attachmentType: asset.attachmentType,
      previewUrl: `/files/${asset.id}/preview`,
      downloadUrl: `/files/${asset.id}/download`,
    };
  }

  private async findViewableAsset(userId: string, fileId: number): Promise<FileAsset> {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id: fileId },
      include: {
        attachments: {
          include: {
            post: {
              select: {
                id: true,
              },
            },
            message: {
              select: {
                chat: {
                  select: {
                    users: {
                      where: { id: userId },
                      select: { id: true },
                    },
                  },
                },
              },
            },
            projectMessage: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!asset || asset.status === 'deleted') {
      throw new NotFoundException('File not found');
    }

    const isOwner = asset.ownerId === userId;
    const isPostAttachment = asset.attachments.some((attachment) => attachment.post !== null);
    const isMessageParticipant = asset.attachments.some(
      (attachment) => (attachment.message?.chat.users.length ?? 0) > 0,
    );
    const isProjectMessageAttachment = asset.attachments.some(
      (attachment) => attachment.projectMessage !== null,
    );

    if (!isOwner && !isPostAttachment && !isMessageParticipant && !isProjectMessageAttachment) {
      throw new ForbiddenException('You cannot access this file');
    }

    return asset;
  }

  private detectFile(file: UploadedMemoryFile): DetectedFile {
    const buffer = file.buffer;
    const originalExt = extname(file.originalname).toLowerCase();

    if (this.hasPrefix(buffer, [0xff, 0xd8, 0xff])) {
      return {
        mimeType: 'image/jpeg',
        extension: '.jpg',
        category: 'image',
        attachmentType: 'image',
        maxBytes: MAX_IMAGE_BYTES,
      };
    }

    if (this.hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
      return {
        mimeType: 'image/png',
        extension: '.png',
        category: 'image',
        attachmentType: 'image',
        maxBytes: MAX_IMAGE_BYTES,
      };
    }

    if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
        buffer.subarray(0, 6).toString('ascii') === 'GIF89a') {
      return {
        mimeType: 'image/gif',
        extension: '.gif',
        category: 'image',
        attachmentType: 'image',
        maxBytes: MAX_IMAGE_BYTES,
      };
    }

    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return {
        mimeType: 'image/webp',
        extension: '.webp',
        category: 'image',
        attachmentType: 'image',
        maxBytes: MAX_IMAGE_BYTES,
      };
    }

    if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
      return {
        mimeType: 'application/pdf',
        extension: '.pdf',
        category: 'document',
        attachmentType: 'pdf',
        maxBytes: MAX_DOCUMENT_BYTES,
      };
    }

    if (this.hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04])) {
      if (originalExt === '.docx') {
        return {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: '.docx',
          category: 'document',
          attachmentType: 'word_document',
          maxBytes: MAX_DOCUMENT_BYTES,
        };
      }

      if (originalExt === '.odt') {
        return {
          mimeType: 'application/vnd.oasis.opendocument.text',
          extension: '.odt',
          category: 'document',
          attachmentType: 'open_document',
          maxBytes: MAX_DOCUMENT_BYTES,
        };
      }

      return {
        mimeType: 'application/zip',
        extension: '.zip',
        category: 'archive',
        attachmentType: 'archive',
        maxBytes: MAX_ARCHIVE_BYTES,
      };
    }

    if (this.looksLikePlainText(buffer)) {
      return {
        mimeType: 'text/plain',
        extension: '.txt',
        category: 'document',
        attachmentType: 'text_document',
        maxBytes: MAX_DOCUMENT_BYTES,
      };
    }

    throw new BadRequestException('Unsupported file type');
  }

  private canPreview(asset: Pick<FileAsset, 'category' | 'mimeType'>): boolean {
    return asset.category === 'image' || asset.mimeType === 'application/pdf' || asset.mimeType === 'text/plain';
  }

  private storagePath(storageKey: string): string {
    return join(this.storageDir, basename(storageKey));
  }

  private cleanOriginalName(value: string): string {
    const cleaned = basename(value).replace(/[^\w.\- ()]/g, '').trim();
    return cleaned || 'upload';
  }

  private hasPrefix(buffer: Buffer, prefix: number[]): boolean {
    return prefix.every((byte, index) => buffer[index] === byte);
  }

  private looksLikePlainText(buffer: Buffer): boolean {
    if (buffer.length === 0 || buffer.includes(0)) return false;

    const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
    for (const byte of sample) {
      const isAllowedControl = byte === 0x09 || byte === 0x0a || byte === 0x0d;
      if (byte < 0x20 && !isAllowedControl) return false;
    }

    return true;
  }
}

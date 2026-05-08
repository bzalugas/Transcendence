import type { AttachmentType, FileCategory } from '@prisma/client';

export interface FileAssetDto {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  attachmentType: AttachmentType;
  previewUrl: string;
  downloadUrl: string;
}

export interface UploadedMemoryFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

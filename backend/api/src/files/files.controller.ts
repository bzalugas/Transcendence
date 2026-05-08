import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { getSessionUserId } from '../auth/session';
import { FilesService } from './files.service';
import type { UploadedMemoryFile } from './files.types';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async upload(
    @Req() req: Request,
    @UploadedFile() file?: UploadedMemoryFile,
  ) {
    const userId = await getSessionUserId(req);
    return this.filesService.createForUser(userId, file);
  }

  @Get(':fileId/metadata')
  async metadata(
    @Req() req: Request,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.filesService.findMetadataForUser(userId, fileId);
  }

  @Get(':fileId/preview')
  @Header('X-Content-Type-Options', 'nosniff')
  async preview(
    @Req() req: Request,
    @Res() res: Response,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.sendFile(req, res, fileId, 'preview');
  }

  @Get(':fileId/download')
  @Header('X-Content-Type-Options', 'nosniff')
  async download(
    @Req() req: Request,
    @Res() res: Response,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.sendFile(req, res, fileId, 'download');
  }

  @Delete(':fileId')
  async delete(
    @Req() req: Request,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.filesService.deleteForUser(userId, fileId);
  }

  private async sendFile(
    req: Request,
    res: Response,
    fileId: number,
    mode: 'preview' | 'download',
  ) {
    const userId = await getSessionUserId(req);
    const { asset, stream, disposition } = await this.filesService.openForUser(
      userId,
      fileId,
      mode,
    );
    const encodedName = encodeURIComponent(asset.originalName);

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Length', String(asset.sizeBytes));
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${asset.originalName.replace(/"/g, '')}"; filename*=UTF-8''${encodedName}`,
    );

    return stream.pipe(res);
  }
}

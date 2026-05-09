import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getSessionUserId } from '../auth/session';
import { PrivacyService } from './privacy.service';

@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  // Creates a tracked request for a user data export.
  @Post('export-request')
  async requestExport(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.privacyService.requestExport(userId);
  }

  // Creates a tracked request for account data deletion.
  @Post('delete-request')
  async requestDeletion(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.privacyService.requestDeletion(userId);
  }

  // Confirms an export or deletion request using the emailed token.
  @Post('requests/confirm')
  async confirmRequest(@Req() req: Request, @Body('token') token: unknown) {
    const userId = await getSessionUserId(req);
    return this.privacyService.confirmRequest(userId, token);
  }

  // Returns lightweight counts for the current export preview UI.
  @Get('export/latest')
  async latestExportPreview(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.privacyService.getLatestExportPreview(userId);
  }

  // Streams a completed export JSON file for its owner.
  @Get('export/:requestId/download')
  @Header('X-Content-Type-Options', 'nosniff')
  async downloadExport(
    @Req() req: Request,
    @Res() res: Response,
    @Param('requestId', ParseIntPipe) requestId: number,
  ) {
    const userId = await getSessionUserId(req);
    const exportFile = await this.privacyService.openExportForUser(
      userId,
      requestId,
    );
    const encodedName = encodeURIComponent(exportFile.fileName);

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', exportFile.mimeType);
    res.setHeader('Content-Length', String(exportFile.sizeBytes));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportFile.fileName}"; filename*=UTF-8''${encodedName}`,
    );

    return exportFile.stream.pipe(res);
  }
}

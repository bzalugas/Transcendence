import { Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
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

  // Returns lightweight counts for the current export preview UI.
  @Get('export/latest')
  async latestExportPreview(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.privacyService.getLatestExportPreview(userId);
  }
}

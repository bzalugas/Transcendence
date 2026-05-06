import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserId } from '../auth/session';
import { JaccardService } from './jaccard.service';

@Controller('suggestions')
export class JaccardController {
  constructor(private readonly jaccardService: JaccardService) {}

  // Returns Jaccard-based profile suggestions for the current session user.
  @Get('me')
  async getMySuggestions(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = await getSessionUserId(req);

    return this.jaccardService.getSuggestions(
      userId,
      limit ? Number(limit) : undefined,
    );
  }

  // Returns Jaccard-based profile suggestions for a specific user id.
  @Get(':userId')
  getSuggestions(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.jaccardService.getSuggestions(
      userId,
      limit ? Number(limit) : undefined,
    );
  }
}

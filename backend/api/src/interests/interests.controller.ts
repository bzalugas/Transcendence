import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserId } from '../auth/session';
import { InterestsService } from './interests.service';

@Controller('interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  // Returns the complete interest catalog used by the frontend picker.
  @Get()
  async findAll(@Req() req: Request) {
    await getSessionUserId(req);
    return this.interestsService.findAll();
  }

  // Returns the interests attached to the current better-auth session user.
  @Get('me')
  async findMine(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.interestsService.findForUser(userId);
  }

  // Returns interests joined by the public profile identified by username.
  @Get(':username')
  async findByUsername(@Req() req: Request, @Param('username') username: string) {
    await getSessionUserId(req);
    return this.interestsService.findForUsername(username);
  }

  // Adds one interest to the current better-auth session user.
  @Post('me/:interestId')
  async joinMine(
    @Req() req: Request,
    @Param('interestId', ParseIntPipe) interestId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.interestsService.joinForUser(userId, interestId);
  }

  // Removes one interest and its matching channel from the current session user.
  @Delete('me/:interestId')
  async leaveMine(
    @Req() req: Request,
    @Param('interestId', ParseIntPipe) interestId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.interestsService.leaveForUser(userId, interestId);
  }
}

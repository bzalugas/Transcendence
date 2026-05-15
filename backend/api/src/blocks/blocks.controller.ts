import { Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserId } from '../auth/session';
import { BlocksService } from './blocks.service';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get('me')
  async findMine(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.blocksService.findBlockedByUser(userId);
  }

  @Post(':username')
  async block(@Req() req: Request, @Param('username') username: string) {
    const userId = await getSessionUserId(req);
    return this.blocksService.blockByUsername(userId, username);
  }

  @Delete(':username')
  async unblock(@Req() req: Request, @Param('username') username: string) {
    const userId = await getSessionUserId(req);
    return this.blocksService.unblockByUsername(userId, username);
  }
}

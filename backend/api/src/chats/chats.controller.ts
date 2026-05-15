import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserId } from '../auth/session';
import { ChatsService } from './chats.service';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async findAccessible(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.chatsService.findAccessibleChats(userId);
  }

  @Get(':chatId/messages')
  async findMessages(
    @Req() req: Request,
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.chatsService.findMessages(userId, chatId);
  }

  @Post('channel/:slug')
  async findOrCreateChannelChat(
    @Req() req: Request,
    @Param('slug') slug: string,
  ) {
    const userId = await getSessionUserId(req);
    return this.chatsService.findOrCreateChannelChat(userId, slug);
  }

  @Post('private/:userId')
  async findOrCreatePrivateChat(
    @Req() req: Request,
    @Param('userId') otherUserId: string,
    @Body() body: { name?: string },
  ) {
    const userId = await getSessionUserId(req);
    return this.chatsService.findOrCreatePrivateChat(
      userId,
      otherUserId,
      body.name,
    );
  }
}

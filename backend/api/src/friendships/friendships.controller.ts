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
import { FriendshipsGateway } from './friendships.gateway';
import { FriendshipsService } from './friendships.service';

@Controller('friendships')
export class FriendshipsController {
  constructor(
    private readonly friendshipsService: FriendshipsService,
    private readonly friendshipsGateway: FriendshipsGateway,
  ) {}

  // Returns pending friend requests received by the current user.
  @Get('requests/received')
  async findReceivedRequests(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.friendshipsService.findReceivedRequests(userId);
  }

  // Returns pending friend requests sent by the current user.
  @Get('requests/sent')
  async findSentRequests(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.friendshipsService.findSentRequests(userId);
  }

  // Sends a friend request from the current user to a profile username.
  @Post('requests/:username')
  async createRequest(@Req() req: Request, @Param('username') username: string) {
    const userId = await getSessionUserId(req);
    const result = await this.friendshipsService.createRequestByUsername(
      userId,
      username,
    );

    if (result.receiverId && result.receivedRequest) {
      this.friendshipsGateway.emitReceivedRequest(
        result.receiverId,
        result.receivedRequest,
      );
    }

    return result.sentRequest;
  }

  // Accepts a pending friend request received by the current user.
  @Post('requests/:requestId/accept')
  async acceptRequest(
    @Req() req: Request,
    @Param('requestId', ParseIntPipe) requestId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.friendshipsService.acceptRequest(userId, requestId);
  }

  // Rejects a pending friend request received by the current user.
  @Post('requests/:requestId/reject')
  async rejectRequest(
    @Req() req: Request,
    @Param('requestId', ParseIntPipe) requestId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.friendshipsService.rejectRequest(userId, requestId);
  }

  // Cancels a pending friend request sent by the current user.
  @Delete('requests/:requestId')
  async cancelRequest(
    @Req() req: Request,
    @Param('requestId', ParseIntPipe) requestId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.friendshipsService.cancelSentRequest(userId, requestId);
  }

  // Returns accepted friends for the current better-auth session user.
  @Get('me')
  async findMine(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.friendshipsService.findAcceptedForUser(userId);
  }

  // Removes an accepted friendship between the current user and a profile username.
  @Delete('me/:username')
  async removeMine(@Req() req: Request, @Param('username') username: string) {
    const userId = await getSessionUserId(req);
    return this.friendshipsService.removeAcceptedByUsername(userId, username);
  }

  // Returns accepted friends for the public profile identified by username.
  @Get(':username')
  async findByUsername(@Req() req: Request, @Param('username') username: string) {
    const userId = await getSessionUserId(req);
    return this.friendshipsService.findAcceptedByUsername(userId, username);
  }
}

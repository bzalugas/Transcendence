import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserId } from '../auth/session';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly channelsGateway: ChannelsGateway,
  ) {}

  // Returns channels visible to the current better-auth session user.
  @Get()
  async findAll(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.channelsService.findAll(userId);
  }

  // Returns channels joined by the current better-auth session user.
  @Get('joined')
  async findJoined(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.channelsService.findJoinedForUser(userId);
  }

  // Returns one joined channel by its interest-name slug.
  @Get(':slug')
  async findOne(@Req() req: Request, @Param('slug') slug: string) {
    const userId = await getSessionUserId(req);
    return this.channelsService.findBySlug(userId, slug);
  }

  // Returns members of one joined channel by its interest-name slug.
  @Get(':slug/members')
  async findMembers(@Req() req: Request, @Param('slug') slug: string) {
    const userId = await getSessionUserId(req);
    return this.channelsService.findMembersBySlug(slug, userId);
  }

  // Returns the persisted post feed for one joined channel.
  @Get(':slug/feed')
  async findFeed(@Req() req: Request, @Param('slug') slug: string) {
    const userId = await getSessionUserId(req);
    return this.channelsService.findFeedBySlug(slug, userId);
  }

  // Creates a persisted post in one channel for the current session user.
  @Post(':slug/posts')
  async createPost(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Body() body: { content?: string; attachmentIds?: number[] },
  ) {
    const userId = await getSessionUserId(req);
    const post = await this.channelsService.createPostBySlug(
      userId,
      slug,
      body.content,
      body.attachmentIds,
    );
    this.channelsGateway.emitPost(slug, post);

    return post;
  }

  // Creates a persisted reply attached to one channel post.
  @Post(':slug/posts/:postId/replies')
  async createReply(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: { content?: string },
  ) {
    const userId = await getSessionUserId(req);
    const reply = await this.channelsService.createReplyBySlug(
      userId,
      slug,
      postId,
      body.content,
    );
    this.channelsGateway.emitReply(slug, postId, reply);

    return reply;
  }

  // Updates a persisted root post and its attached files when the current user is its author.
  @Patch(':slug/posts/:postId')
  async updatePost(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: { content?: string; attachmentIds?: number[] },
  ) {
    const userId = await getSessionUserId(req);
    return this.channelsService.updatePostBySlug(
      userId,
      slug,
      postId,
      body.content,
      body.attachmentIds,
    );
  }

  // Removes a persisted root post when the current user is its author.
  @Delete(':slug/posts/:postId')
  async deletePost(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    const userId = await getSessionUserId(req);
    return this.channelsService.deletePostBySlug(userId, slug, postId);
  }

  // Joins a channel and its matching interest for the current user.
  @Post(':slug/join')
  async join(@Req() req: Request, @Param('slug') slug: string) {
    const userId = await getSessionUserId(req);
    return this.channelsService.joinBySlug(userId, slug);
  }

  // Leaves a channel and its matching interest for the current user.
  @Delete(':slug/leave')
  async leave(@Req() req: Request, @Param('slug') slug: string) {
    const userId = await getSessionUserId(req);
    return this.channelsService.leaveBySlug(userId, slug);
  }
}

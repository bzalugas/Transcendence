import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { getSessionAdmin } from '../auth/session';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async findAllUsers(@Req() req: Request) {
    await getSessionAdmin(req);
    return this.adminService.findAllUsers();
  }

  @Get('users/:id/posts')
  async findUserPosts(@Req() req: Request, @Param('id') id: string) {
    await getSessionAdmin(req);
    return this.adminService.findUserPosts(id);
  }

  @Post('users/:id/ban')
  async banUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const requesterId = await getSessionAdmin(req);
    return this.adminService.banUser(requesterId, id, body.reason);
  }

  @Post('users/:id/unban')
  async unbanUser(@Req() req: Request, @Param('id') id: string) {
    const requesterId = await getSessionAdmin(req);
    return this.adminService.unbanUser(requesterId, id);
  }

  @Delete('posts/:id')
  async deletePost(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.deletePost(id);
  }

  @Delete('project-messages/:id')
  async deleteProjectMessage(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.deleteProjectMessage(id);
  }

  @Get('projects')
  async findAllProjects(@Req() req: Request) {
    await getSessionAdmin(req);
    return this.adminService.findAllProjects();
  }

  @Post('projects')
  async createProject(
    @Req() req: Request,
    @Body() body: { name?: string; description?: string; color?: string },
  ) {
    await getSessionAdmin(req);
    return this.adminService.createProject(body);
  }

  @Delete('projects/:id')
  async deleteProject(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.deleteProject(id);
  }

  @Delete('users/:id')
  async deleteUser(@Req() req: Request, @Param('id') id: string) {
    const requesterId = await getSessionAdmin(req);
    return this.adminService.deleteUser(requesterId, id);
  }

  @Get('channels')
  async findAllChannels(@Req() req: Request) {
    await getSessionAdmin(req);
    return this.adminService.findAllChannels();
  }

  @Post('channels')
  async createChannel(
    @Req() req: Request,
    @Body() body: { name: string; color: string; description?: string },
  ) {
    await getSessionAdmin(req);
    return this.adminService.createChannel(body.name, body.color, body.description);
  }

  @Delete('channels/:id')
  async deleteChannel(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.deleteChannel(id);
  }

  @Get('channels/:id/members')
  async findChannelMembers(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.findChannelMembers(id);
  }

  @Post('users/:userId/channels/:channelId')
  async addUserToChannel(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Param('channelId', ParseIntPipe) channelId: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.addUserToChannel(userId, channelId);
  }

  @Delete('users/:userId/channels/:channelId')
  async removeUserFromChannel(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Param('channelId', ParseIntPipe) channelId: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.removeUserFromChannel(userId, channelId);
  }

  @Get('interest-requests')
  async findPendingInterestRequests(@Req() req: Request) {
    await getSessionAdmin(req);
    return this.adminService.findPendingInterestRequests();
  }

  @Post('interest-requests/:id/approve')
  async approveInterestRequest(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string; color?: string },
  ) {
    await getSessionAdmin(req);
    return this.adminService.approveInterestRequest(id, body);
  }

  @Post('interest-requests/:id/reject')
  async rejectInterestRequest(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.rejectInterestRequest(id);
  }
}

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

  @Delete('users/:id')
  async deleteUser(@Req() req: Request, @Param('id') id: string) {
    await getSessionAdmin(req);
    return this.adminService.deleteUser(id);
  }

  @Get('channels')
  async findAllChannels(@Req() req: Request) {
    await getSessionAdmin(req);
    return this.adminService.findAllChannels();
  }

  @Post('channels')
  async createChannel(
    @Req() req: Request,
    @Body() body: { name: string; color: string },
  ) {
    await getSessionAdmin(req);
    return this.adminService.createChannel(body.name, body.color);
  }

  @Delete('channels/:id')
  async deleteChannel(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await getSessionAdmin(req);
    return this.adminService.deleteChannel(id);
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
}

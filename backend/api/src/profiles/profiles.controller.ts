import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserId } from '../auth/session';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  // Returns the profile attached to the current better-auth session user.
  @Get('me')
  async findMine(@Req() req: Request) {
    const userId = await getSessionUserId(req);
    return this.profilesService.findByUserId(userId);
  }

  // Updates editable profile fields for the current better-auth session user.
  @Patch('me')
  async updateMine(@Req() req: Request, @Body() body: { bio?: string | null; socials?: unknown }) {
    const userId = await getSessionUserId(req);
    return this.profilesService.updateByUserId(userId, body);
  }

  // Returns real aggregate profile stats for shared frontend side panels.
  @Get('stats')
  async getStats(@Req() req: Request) {
    await getSessionUserId(req);
    return this.profilesService.getStats();
  }

  // Returns one profile by login, display name, or email-derived username.
  @Get(':username')
  async findOne(@Req() req: Request, @Param('username') username: string) {
    await getSessionUserId(req);
    return this.profilesService.findByUsername(username);
  }
}

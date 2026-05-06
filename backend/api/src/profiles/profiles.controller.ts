import { Controller, Get, Param, Req } from '@nestjs/common';
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

  // Returns one profile by login, display name, or email-derived username.
  @Get(':username')
  findOne(@Param('username') username: string) {
    return this.profilesService.findByUsername(username);
  }
}

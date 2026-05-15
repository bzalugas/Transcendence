import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserWithRole } from '../auth/session';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    const { userId } = await getSessionUserWithRole(req, ['USER', 'ADMIN']);
    return this.projectsService.findAll(userId);
  }

  @Post(':slug/messages')
  async createMessage(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Body() body: { content?: string },
  ) {
    const { userId } = await getSessionUserWithRole(req, ['USER', 'ADMIN']);
    return this.projectsService.createMessageBySlug(userId, slug, body.content);
  }
}

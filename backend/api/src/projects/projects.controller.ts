import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserId } from '../auth/session';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    await getSessionUserId(req);
    return this.projectsService.findAll();
  }
}

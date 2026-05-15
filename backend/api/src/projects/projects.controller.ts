import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getSessionUserWithRole } from '../auth/session';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    await getSessionUserWithRole(req, ['USER', 'ADMIN']);
    return this.projectsService.findAll();
  }
}

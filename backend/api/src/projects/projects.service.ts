import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProjectDto {
  id: number;
  slug: string;
  name: string;
  color: string;
  description: string;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProjectDto[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return projects.map((project) => ({
      id: project.id,
      slug: project.slug,
      name: project.name,
      color: project.color,
      description: project.description,
    }));
  }
}

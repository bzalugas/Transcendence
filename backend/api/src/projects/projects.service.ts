import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProjectMessageDto {
  id: string;
  senderId: string;
  sender: string;
  initials: string;
  avatarUrl?: string;
  text: string;
  time: string;
  daysAgo: number;
  me: boolean;
}

export interface ProjectDto {
  id: number;
  slug: string;
  name: string;
  color: string;
  description: string;
  messages: ProjectMessageDto[];
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUserId: string): Promise<ProjectDto[]> {
    const projects = await this.prisma.project.findMany({
      include: {
        messages: {
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return projects.map((project) => ({
      id: project.id,
      slug: project.slug,
      name: project.name,
      color: project.color,
      description: project.description,
      messages: project.messages.map((message) =>
        this.toMessageDto(message, currentUserId),
      ),
    }));
  }

  async createMessageBySlug(
    currentUserId: string,
    slug: string,
    content?: string,
  ): Promise<ProjectMessageDto> {
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      throw new BadRequestException('Message content is required');
    }

    const project = await this.prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    const message = await this.prisma.projectMessage.create({
      data: {
        projectId: project.id,
        senderId: currentUserId,
        content: trimmedContent,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.toMessageDto(message, currentUserId);
  }

  private toMessageDto(
    message: {
      id: number;
      senderId: string;
      content: string;
      createdAt: Date;
      sender: {
        login: string | null;
        name: string | null;
        email: string;
        image: string | null;
        profile: {
          avatarUri: string | null;
        } | null;
      };
    },
    currentUserId: string,
  ): ProjectMessageDto {
    const sender = this.userDisplayName(message.sender);

    return {
      id: String(message.id),
      senderId: message.senderId,
      sender,
      initials: this.initials(sender),
      avatarUrl: message.sender.profile?.avatarUri ?? message.sender.image ?? undefined,
      text: message.content,
      time: this.relativeTime(message.createdAt),
      daysAgo: Math.floor(
        Math.max(0, Date.now() - message.createdAt.getTime()) / 86_400_000,
      ),
      me: message.senderId === currentUserId,
    };
  }

  private userDisplayName(user: {
    login: string | null;
    name: string | null;
    email: string;
  }): string {
    return user.login ?? user.name ?? user.email.split('@')[0];
  }

  private initials(value: string): string {
    const parts = value
      .trim()
      .split(/[\s._-]+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toLowerCase();
    }

    return value.slice(0, 2).toLowerCase();
  }

  private relativeTime(date: Date): string {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (elapsedSeconds < 60) return 'just now';

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) return `${elapsedDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

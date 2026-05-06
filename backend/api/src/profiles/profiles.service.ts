import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProfileUserDto {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  bio?: string;
  level: number;
}

export interface ProfileStatsDto {
  students: number;
  online: number;
  topInterest: string;
  activeGroups: number;
}

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  // Builds aggregate values shown in the shared cohort stats side panel.
  async getStats(): Promise<ProfileStatsDto> {
    const [students, topInterest, activeGroups] = await Promise.all([
      this.prisma.user.count(),
      this.getTopInterestName(),
      this.prisma.channel.count(),
    ]);

    return {
      students,
      online: 23,
      topInterest,
      activeGroups,
    };
  }

  // Finds a profile by its stable user id.
  async findByUserId(userId: string): Promise<ProfileUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return this.toDto(user);
  }

  // Finds a profile by login, name, or email-derived username.
  async findByUsername(username: string): Promise<ProfileUserDto> {
    const normalizedUsername = decodeURIComponent(username).trim().toLowerCase();
    const users = await this.prisma.user.findMany({
      include: { profile: true },
    });
    const user = users.find((candidate) => {
      const displayName = this.userDisplayName(candidate).toLowerCase();
      const emailName = candidate.email.split('@')[0].toLowerCase();

      return displayName === normalizedUsername || emailName === normalizedUsername;
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return this.toDto(user);
  }

  // Converts a Prisma user with profile data into the frontend user shape.
  private toDto(user: {
    id: string;
    email: string;
    login: string | null;
    name: string | null;
    image: string | null;
    profile: {
      avatarUri: string | null;
      bio: string | null;
      level: number | null;
    } | null;
  }): ProfileUserDto {
    const username = this.userDisplayName(user);

    return {
      id: user.id,
      username,
      initials: this.initials(username),
      avatarUrl: user.profile?.avatarUri ?? user.image ?? undefined,
      bio: user.profile?.bio ?? undefined,
      level: user.profile?.level ?? 0,
    };
  }

  // Chooses the best public display name for a user.
  private userDisplayName(user: {
    login: string | null;
    name: string | null;
    email: string;
  }): string {
    return user.login ?? user.name ?? user.email.split('@')[0];
  }

  // Builds compact initials from a login or display name.
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

  // Finds the interest joined by the most users, falling back when no joins exist.
  private async getTopInterestName(): Promise<string> {
    const [topInterest] = await this.prisma.user_Interest.groupBy({
      by: ['interestId'],
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 1,
    });

    if (!topInterest) return 'None';

    const interest = await this.prisma.interest.findUnique({
      where: {
        id: topInterest.interestId,
      },
      select: {
        name: true,
      },
    });

    return interest?.name ?? 'None';
  }
}

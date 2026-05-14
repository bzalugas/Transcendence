import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProfileUserDto {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  bio?: string;
  level: number;
  socials: ProfileSocialDto[];
}

export interface ProfileSocialDto {
  id: number;
  platform: string;
  label: string;
  url: string;
}

export interface ProfileStatsDto {
  students: number;
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
      topInterest,
      activeGroups,
    };
  }

  // Finds a profile by its stable user id.
  async findByUserId(userId: string): Promise<ProfileUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userProfileInclude(),
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return this.toDto(user);
  }

  // Updates editable profile fields and returns the refreshed public user shape.
  async updateByUserId(
    userId: string,
    updates: { bio?: string | null; socials?: unknown; avatarUri?: string | null } = {},
  ): Promise<ProfileUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    const shouldUpdateBio = Object.prototype.hasOwnProperty.call(updates, 'bio');
    const shouldUpdateSocials = Object.prototype.hasOwnProperty.call(updates, 'socials');
    const shouldUpdateAvatar = Object.prototype.hasOwnProperty.call(updates, 'avatarUri');

    if (shouldUpdateBio && updates.bio !== null && typeof updates.bio !== 'string') {
      throw new BadRequestException('Bio must be a string or null');
    }

    if (shouldUpdateAvatar) {
      this.assertAvatarUri(updates.avatarUri);
    }

    if (!shouldUpdateBio && !shouldUpdateSocials && !shouldUpdateAvatar) {
      return this.findByUserId(userId);
    }

    const bio = typeof updates.bio === 'string' ? updates.bio.trim() || null : null;
    const avatarUri = typeof updates.avatarUri === 'string' ? updates.avatarUri : null;
    const socials = shouldUpdateSocials
      ? this.normalizeSocials(updates.socials)
      : undefined;

    await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...(shouldUpdateBio ? { bio } : {}),
        ...(shouldUpdateAvatar ? { avatarUri } : {}),
        ...(socials && socials.length > 0 ? { socials: { create: socials } } : {}),
      },
      update: {
        ...(shouldUpdateBio ? { bio } : {}),
        ...(shouldUpdateAvatar ? { avatarUri } : {}),
        ...(socials
          ? {
              socials: {
                deleteMany: {},
                ...(socials.length > 0 ? { create: socials } : {}),
              },
            }
          : {}),
      },
    });

    return this.findByUserId(userId);
  }

  // Finds a profile by login, name, or email-derived username.
  async findByUsername(username: string): Promise<ProfileUserDto> {
    const normalizedUsername = decodeURIComponent(username).trim().toLowerCase();
    const users = await this.prisma.user.findMany({
      include: this.userProfileInclude(),
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
      socials: {
        id: number;
        platform: string;
        label: string;
        url: string;
      }[];
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
      socials: user.profile?.socials ?? [],
    };
  }

  // Builds the shared include used when returning public profile data.
  private userProfileInclude() {
    return {
      profile: {
        include: {
          socials: {
            orderBy: {
              id: 'asc' as const,
            },
          },
        },
      },
    };
  }

  // Validates and normalizes the full social link list submitted by the frontend.
  private normalizeSocials(value: unknown) {
    if (!Array.isArray(value)) {
      throw new BadRequestException('Socials must be an array');
    }

    return value.map((social) => {
      if (!social || typeof social !== 'object') {
        throw new BadRequestException('Each social link must be an object');
      }

      const item = social as {
        platform?: unknown;
        label?: unknown;
        url?: unknown;
      };

      if (
        typeof item.platform !== 'string' ||
        typeof item.label !== 'string' ||
        typeof item.url !== 'string'
      ) {
        throw new BadRequestException('Social platform, label, and url are required');
      }

      const platform = item.platform.trim().toLowerCase();
      const label = item.label.trim();
      const url = item.url.trim();

      if (!platform || !label || !this.isHttpUrl(url)) {
        throw new BadRequestException('Social links need a platform, label, and valid URL');
      }

      return {
        platform,
        label,
        url,
      };
    });
  }

  // Accepts only cropped fixed-size JPEG data URLs generated by the frontend editor.
  private assertAvatarUri(value: unknown): void {
    if (value === null || value === undefined) return;

    if (typeof value !== 'string') {
      throw new BadRequestException('Avatar must be a string or null');
    }

    if (!value.startsWith('data:image/jpeg;base64,')) {
      throw new BadRequestException('Avatar must be a cropped JPEG image');
    }

    const maxAvatarChars = 512 * 1024;
    if (value.length > maxAvatarChars) {
      throw new BadRequestException('Avatar image is too large');
    }
  }

  // Checks that a profile social URL can be opened safely as an external link.
  private isHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
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

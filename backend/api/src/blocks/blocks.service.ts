import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface BlockedUserDto {
  id: string;
  initials: string;
  avatarUrl?: string;
  name: string;
  level: number;
  blockedAt: string;
}

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async findBlockedByUser(userId: string): Promise<BlockedUserDto[]> {
    const blocks = await this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return blocks.map((block) => ({
      ...this.toBlockedUserDto(block.blocked),
      blockedAt: block.createdAt.toISOString(),
    }));
  }

  async blockByUsername(
    blockerId: string,
    username: string,
  ): Promise<BlockedUserDto> {
    const blocked = await this.findUserByUsername(username);

    if (blocked.id === blockerId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const pairKey = this.friendPairKey(blockerId, blocked.id);
    const block = await this.prisma.$transaction(async (tx) => {
      await tx.friendRequest.deleteMany({
        where: {
          pairKey,
        },
      });

      return tx.blockedUser.upsert({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId: blocked.id,
          },
        },
        create: {
          blockerId,
          blockedId: blocked.id,
        },
        update: {},
        include: {
          blocked: {
            include: {
              profile: true,
            },
          },
        },
      });
    });

    return {
      ...this.toBlockedUserDto(block.blocked),
      blockedAt: block.createdAt.toISOString(),
    };
  }

  async unblockByUsername(
    blockerId: string,
    username: string,
  ): Promise<{ unblocked: true }> {
    const blocked = await this.findUserByUsername(username);

    await this.prisma.blockedUser.deleteMany({
      where: {
        blockerId,
        blockedId: blocked.id,
      },
    });

    return { unblocked: true };
  }

  async getBlockedPairUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.blockedUser.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: {
        blockerId: true,
        blockedId: true,
      },
    });

    return blocks.map((block) =>
      block.blockerId === userId ? block.blockedId : block.blockerId,
    );
  }

  async isBlockedBetween(firstUserId: string, secondUserId: string) {
    const block = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: firstUserId, blockedId: secondUserId },
          { blockerId: secondUserId, blockedId: firstUserId },
        ],
      },
      select: {
        blockerId: true,
      },
    });

    return Boolean(block);
  }

  private async findUserByUsername(username: string) {
    const normalizedUsername = decodeURIComponent(username).trim().toLowerCase();
    const users = await this.prisma.user.findMany({
      include: {
        profile: true,
      },
    });
    const user = users.find((candidate) => {
      const displayName = this.userDisplayName(candidate).toLowerCase();
      const emailName = candidate.email.split('@')[0].toLowerCase();

      return displayName === normalizedUsername || emailName === normalizedUsername;
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private toBlockedUserDto(user: {
    id: string;
    email: string;
    login: string | null;
    name: string | null;
    image: string | null;
    profile: {
      avatarUri: string | null;
      level: number | null;
    } | null;
  }) {
    const name = this.userDisplayName(user);

    return {
      id: user.id,
      initials: this.initials(name),
      avatarUrl: user.profile?.avatarUri ?? user.image ?? undefined,
      name,
      level: user.profile?.level ?? 0,
    };
  }

  private friendPairKey(firstUserId: string, secondUserId: string): string {
    return [firstUserId, secondUserId].sort().join(':');
  }

  private userDisplayName(user: {
    login: string | null;
    name: string | null;
    email: string;
    profile?: ({ pseudo?: string | null } & Record<string, unknown>) | null;
  }): string {
    return user.profile?.pseudo ?? user.login ?? user.name ?? user.email.split('@')[0];
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
}

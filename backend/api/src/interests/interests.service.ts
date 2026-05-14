import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface InterestDto {
  id: number;
  name: string;
  color: string;
  desc: string;
  members: number;
}

@Injectable()
export class InterestsService {
  constructor(private readonly prisma: PrismaService) {}

  // Reads every interest and includes the number of users attached to each one.
  async findAll(): Promise<InterestDto[]> {
    const interests = await this.prisma.interest.findMany({
      include: {
        channel: true,
        _count: {
          select: {
            interestedUsers: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return interests.map((interest) => this.toDto(interest));
  }

  // Reads only the interests currently joined by one user.
  async findForUser(userId: string): Promise<InterestDto[]> {
    const userInterests = await this.prisma.user_Interest.findMany({
      where: { userId },
      include: {
        interest: {
          include: {
            channel: true,
            _count: {
              select: {
                interestedUsers: true,
              },
            },
          },
        },
      },
    });

    return userInterests
      .map((userInterest) => this.toDto(userInterest.interest))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Reads interests joined by the user matching a public profile username.
  async findForUsername(username: string): Promise<InterestDto[]> {
    const user = await this.findUserByUsername(username);
    return this.findForUser(user.id);
  }

  // Creates the user-interest relation, joins the matching channel, and returns the interest.
  async joinForUser(userId: string, interestId: number): Promise<InterestDto> {
    const interest = await this.prisma.interest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      throw new NotFoundException('Interest not found');
    }

    await this.prisma.user_Interest.upsert({
      where: {
        userId_interestId: {
          userId,
          interestId,
        },
      },
      create: {
        userId,
        interestId,
      },
      update: {},
    });

    const channel = await this.prisma.channel.findUnique({
      where: { interestId },
    });

    if (channel) {
      await this.prisma.user_Channel.upsert({
        where: {
          userId_channelId: {
            userId,
            channelId: channel.id,
          },
        },
        create: {
          userId,
          channelId: channel.id,
          isFavorite: false,
        },
        update: {},
      });
    }

    const joinedInterest = await this.prisma.interest.findUniqueOrThrow({
      where: { id: interestId },
      include: {
        _count: {
          select: {
            interestedUsers: true,
          },
        },
      },
    });

    return this.toDto(joinedInterest);
  }

  // Removes the user-interest relation and the matching channel membership.
  async leaveForUser(userId: string, interestId: number): Promise<{ left: true }> {
    const interest = await this.prisma.interest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      throw new NotFoundException('Interest not found');
    }

    await this.prisma.user_Interest.deleteMany({
      where: {
        userId,
        interestId,
      },
    });

    const channel = await this.prisma.channel.findUnique({
      where: { interestId },
    });

    if (channel) {
      await this.prisma.user_Channel.deleteMany({
        where: {
          userId,
          channelId: channel.id,
        },
      });
    }

    return { left: true };
  }

  private toDto(interest: {
    id: number;
    name: string;
    color: string | null;
    channel: { description: string | null } | null;
    _count: { interestedUsers: number };
  }): InterestDto {
    return {
      id: interest.id,
      name: interest.name,
      color: interest.color ?? '#6B7280',
      desc: interest.channel?.description ?? '',
      members: interest._count.interestedUsers,
    };
  }

  // Finds one user by login, name, or email-derived username.
  private async findUserByUsername(username: string) {
    const normalizedUsername = decodeURIComponent(username).trim().toLowerCase();
    const users = await this.prisma.user.findMany();
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

  // Chooses the best public display name for a user.
  private userDisplayName(user: {
    login: string | null;
    name: string | null;
    email: string;
  }): string {
    return user.login ?? user.name ?? user.email.split('@')[0];
  }
}

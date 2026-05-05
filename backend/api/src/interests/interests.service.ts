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

  // Creates the user-interest relation if needed and returns the joined interest.
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

  private toDto(interest: {
    id: number;
    name: string;
    color: string | null;
    _count: { interestedUsers: number };
  }): InterestDto {
    return {
      id: interest.id,
      name: interest.name,
      color: interest.color ?? '#6B7280',
      desc: '',
      members: interest._count.interestedUsers,
    };
  }
}

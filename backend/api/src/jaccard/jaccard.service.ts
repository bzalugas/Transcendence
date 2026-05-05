import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JaccardService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAmisIds(userId: string): Promise<string[]> {
    const friendRequests = await this.prisma.friendRequest.findMany({
      where: {
        AND: [
          { status: 'Accepted' },
          {
            OR: [
              { senderId: userId },
              { receiverId: userId },
            ],
          },
        ],
      },
    });

    return friendRequests.map((fr) =>
      fr.senderId === userId ? fr.receiverId : fr.senderId
    );
  }

  async getSuggestions(userId: string, limit: number = 10): Promise<object[]> {
    const safeLimit = Math.min(limit, 50);

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { interest: true } } },
    });

    if (!currentUser) throw new Error(`User ${userId} not found`);

    const currentInterestIds = currentUser.interests.map(i => i.interestId);

    const interestMap = new Map(
      currentUser.interests.map(i => [i.interestId, i.interest.name])
    );

    const amisIds = await this.getAmisIds(userId);

    const candidats = await this.prisma.user.findMany({
      where: {
        id: { notIn: [...amisIds, userId] },
        interests: {
          some: { interestId: { in: currentInterestIds } },
        },
      },
      include: {
        interests: { include: { interest: true } },
        profile: true,
      },
    });

    const suggestions = candidats.map((user) => {
      const interestIds = user.interests.map((i: { interestId: number }) => i.interestId);
      const score = this.jaccardScore(currentInterestIds, interestIds);
      const sharedIds = new Set(currentInterestIds.filter(id => interestIds.includes(id)));
      const displayName = user.login ?? user.name ?? user.email.split('@')[0];

      return {
        name: displayName,
        initials: displayName.substring(0, 2),
        level: user.profile?.level ?? 0,
        online: false,
        score,
        sharedTags: [...sharedIds].map(id => interestMap.get(id) as string),
        otherTags: user.interests
          .filter((i: { interestId: number }) => !sharedIds.has(i.interestId))
          .map((i: { interest: { name: string } }) => i.interest.name),
      };
    });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit);
  }

  private jaccardScore(a: number[], b: number[]): number {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = [...setA].filter(x => setB.has(x));
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) return 0;

    return intersection.length / union.size;
  }
}

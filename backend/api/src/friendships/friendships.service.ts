import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FriendDto {
  id: string;
  initials: string;
  avatarUrl?: string;
  name: string;
  level: number;
}

export interface FriendRequestDto {
  id: number;
  initials: string;
  name: string;
  sharedCount: number;
}

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lists pending requests received by one user.
  async findReceivedRequests(userId: string): Promise<FriendRequestDto[]> {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'Pending',
      },
      include: {
        sender: {
          include: {
            profile: true,
            interests: true,
          },
        },
      },
      orderBy: {
        CreatedAt: 'desc',
      },
    });
    const currentInterestIds = await this.getInterestIds(userId);

    return requests.map((request) =>
      this.toFriendRequestDto(request.id, request.sender, currentInterestIds),
    );
  }

  // Lists pending requests sent by one user.
  async findSentRequests(userId: string): Promise<FriendRequestDto[]> {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: 'Pending',
      },
      include: {
        sender: {
          include: {
            profile: true,
            interests: true,
          },
        },
        receiver: {
          include: {
            profile: true,
            interests: true,
          },
        },
      },
      orderBy: {
        CreatedAt: 'desc',
      },
    });
    const currentInterestIds = await this.getInterestIds(userId);

    return requests.map((request) =>
      this.toFriendRequestDto(request.id, request.receiver, currentInterestIds),
    );
  }

  // Creates or reuses a pending friend request for a target username.
  async createRequestByUsername(
    userId: string,
    username: string,
  ): Promise<FriendRequestDto> {
    const receiver = await this.findUserByUsername(username);

    if (receiver.id === userId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const existing = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: receiver.id,
          },
          {
            senderId: receiver.id,
            receiverId: userId,
          },
        ],
      },
      orderBy: {
        UpdatedAt: 'desc',
      },
      include: {
        sender: {
          include: {
            profile: true,
            interests: true,
          },
        },
        receiver: {
          include: {
            profile: true,
            interests: true,
          },
        },
      },
    });

    if (existing) {
      if (existing.status === 'Rejected') {
        const request = await this.prisma.friendRequest.update({
          where: {
            id: existing.id,
          },
          data: {
            senderId: userId,
            receiverId: receiver.id,
            status: 'Pending',
          },
          include: {
            receiver: {
              include: {
                profile: true,
                interests: true,
              },
            },
          },
        });

        return this.toFriendRequestDto(
          request.id,
          request.receiver,
          await this.getInterestIds(userId),
        );
      }

      const requestUser = existing.senderId === userId ? existing.receiver : existing.sender;

      return this.toFriendRequestDto(
        existing.id,
        requestUser,
        await this.getInterestIds(userId),
      );
    }

    const request = await this.prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: receiver.id,
        status: 'Pending',
      },
      include: {
        receiver: {
          include: {
            profile: true,
            interests: true,
          },
        },
      },
    });

    return this.toFriendRequestDto(
      request.id,
      request.receiver,
      await this.getInterestIds(userId),
    );
  }

  // Marks a pending request as accepted when it belongs to the current user.
  async acceptRequest(userId: string, requestId: number): Promise<FriendDto> {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'Pending',
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    await this.prisma.friendRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: 'Accepted',
      },
    });

    return this.toFriendDto(request.sender);
  }

  // Marks a pending request as rejected when it belongs to the current user.
  async rejectRequest(userId: string, requestId: number): Promise<{ rejected: true }> {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'Pending',
      },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    await this.prisma.friendRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: 'Rejected',
      },
    });

    return { rejected: true };
  }

  // Lists accepted friends for one user id from both sender and receiver sides.
  async findAcceptedForUser(userId: string): Promise<FriendDto[]> {
    const friendIds = await this.getAcceptedFriendIds(userId);

    if (friendIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: friendIds,
        },
      },
      include: {
        profile: true,
      },
    });

    return users
      .map((user) => this.toFriendDto(user))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Lists accepted friends for the user matching a public profile username.
  async findAcceptedByUsername(username: string): Promise<FriendDto[]> {
    const user = await this.findUserByUsername(username);
    return this.findAcceptedForUser(user.id);
  }

  // Deletes the accepted friendship between the current user and a username.
  async removeAcceptedByUsername(
    userId: string,
    username: string,
  ): Promise<{ removed: true }> {
    const friend = await this.findUserByUsername(username);

    await this.prisma.friendRequest.deleteMany({
      where: {
        status: 'Accepted',
        OR: [
          {
            senderId: userId,
            receiverId: friend.id,
          },
          {
            senderId: friend.id,
            receiverId: userId,
          },
        ],
      },
    });

    return { removed: true };
  }

  // Finds ids connected to one user by accepted FriendRequest rows.
  async getAcceptedFriendIds(userId: string): Promise<string[]> {
    const friendRequests = await this.prisma.friendRequest.findMany({
      where: {
        status: 'Accepted',
        OR: [
          {
            senderId: userId,
          },
          {
            receiverId: userId,
          },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    return friendRequests.map((friendRequest) =>
      friendRequest.senderId === userId
        ? friendRequest.receiverId
        : friendRequest.senderId,
    );
  }

  // Reads the interest ids joined by one user.
  private async getInterestIds(userId: string): Promise<number[]> {
    const interests = await this.prisma.user_Interest.findMany({
      where: {
        userId,
      },
      select: {
        interestId: true,
      },
    });

    return interests.map((interest) => interest.interestId);
  }

  // Converts a pending request user into the frontend request shape.
  private toFriendRequestDto(
    requestId: number,
    user: {
      email: string;
      login: string | null;
      name: string | null;
      interests: {
        interestId: number;
      }[];
    },
    currentInterestIds: number[],
  ): FriendRequestDto {
    const name = this.userDisplayName(user);
    const currentInterestSet = new Set(currentInterestIds);
    const sharedCount = user.interests.filter((interest) =>
      currentInterestSet.has(interest.interestId),
    ).length;

    return {
      id: requestId,
      initials: this.initials(name),
      name,
      sharedCount,
    };
  }

  // Finds one user by login, name, or email-derived username.
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

  // Converts a Prisma user into the friend shape consumed by the frontend.
  private toFriendDto(user: {
    id: string;
    email: string;
    login: string | null;
    name: string | null;
    image: string | null;
    profile: {
      avatarUri: string | null;
      level: number | null;
    } | null;
  }): FriendDto {
    const name = this.userDisplayName(user);

    return {
      id: user.id,
      initials: this.initials(name),
      avatarUrl: user.profile?.avatarUri ?? user.image ?? undefined,
      name,
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
}

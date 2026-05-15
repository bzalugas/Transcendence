import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        login: true,
        name: true,
        role: true,
        createdAt: true,
        bannedAt: true,
        moderationReason: true,
        profile: {
          select: {
            firstname: true,
            lastname: true,
            pseudo: true,
            avatarUri: true,
            level: true,
            bio: true,
            socials: true,
          },
        },
        _count: {
          select: {
            posts: true,
            channels: true,
            interests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const friendCounts = await this.getFriendCounts(users.map((user) => user.id));

    return users.map((user) => ({
      ...user,
      friendCount: friendCounts.get(user.id) ?? 0,
    }));
  }

  async findUserPosts(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      include: {
        channel: {
          include: {
            interest: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
          },
        },
        _count: {
          select: {
            children: true,
            reactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    const projectMessages = await this.findUserProjectMessages(userId);

    const channelItems = posts.map((post) => ({
      id: String(post.id),
      kind: post.parentId === null ? 'post' : 'comment',
      source: 'channel',
      sourceLabel: post.channel.interest.name,
      channelId: post.channelId,
      parentId: post.parentId ? String(post.parentId) : null,
      parentPreview: post.parent?.content ?? null,
      body: post.content,
      createdAt: post.createdAt.toISOString(),
      replyCount: post._count.children,
      reactionCount: post._count.reactions,
    }));

    const projectItems = projectMessages.map((message) => ({
      id: String(message.id),
      kind: 'message',
      source: 'project',
      sourceLabel: message.project.name,
      projectId: message.projectId,
      parentId: null,
      parentPreview: null,
      body: message.content,
      createdAt: message.createdAt.toISOString(),
      replyCount: 0,
      reactionCount: 0,
    }));

    return [...channelItems, ...projectItems].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  }

  private async findUserProjectMessages(userId: string) {
    try {
      return await this.prisma.projectMessage.findMany({
        where: { senderId: userId },
        include: {
          project: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      });
    } catch {
      return [];
    }
  }

  async banUser(requesterId: string, userId: string, reason?: string) {
    await this.assertCanModerateUser(requesterId, userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        bannedAt: new Date(),
        moderationReason: this.normalizeReason(reason),
      },
      select: {
        id: true,
        bannedAt: true,
        moderationReason: true,
      },
    });
  }

  async unbanUser(requesterId: string, userId: string) {
    await this.assertCanModerateUser(requesterId, userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        bannedAt: null,
        moderationReason: null,
      },
      select: {
        id: true,
        bannedAt: true,
        moderationReason: true,
      },
    });
  }

  async deletePost(postId: number): Promise<{ deleted: true }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        parentId: true,
        children: {
          select: {
            id: true,
          },
        },
        attachments: {
          select: {
            fileId: true,
            file: {
              select: {
                storageKey: true,
              },
            },
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const postIds =
      post.parentId === null
        ? [post.id, ...post.children.map((child) => child.id)]
        : [post.id];
    const storageKeys = post.attachments.map((attachment) => attachment.file.storageKey);
    const fileIds = post.attachments.map((attachment) => attachment.fileId);

    await this.prisma.$transaction([
      this.prisma.reaction.deleteMany({
        where: { postId: { in: postIds } },
      }),
      this.prisma.notification.deleteMany({
        where: { postId: { in: postIds } },
      }),
      this.prisma.fileAsset.deleteMany({
        where: { id: { in: fileIds } },
      }),
      this.prisma.post.deleteMany({
        where: { id: { in: postIds.filter((id) => id !== post.id) } },
      }),
      this.prisma.post.delete({
        where: { id: post.id },
      }),
    ]);

    await this.filesService.deleteStorageKeys(storageKeys);

    return { deleted: true };
  }

  async deleteProjectMessage(messageId: number): Promise<{ deleted: true }> {
    const message = await this.prisma.projectMessage.findUnique({
      where: { id: messageId },
      select: { id: true },
    });

    if (!message) throw new NotFoundException('Project message not found');

    await this.prisma.projectMessage.delete({
      where: { id: messageId },
    });

    return { deleted: true };
  }

  async deleteUser(requesterId: string, userId: string) {
    if (requesterId === userId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction(async (tx) => {
      const posts = await tx.post.findMany({
        where: { authorId: userId },
        select: { id: true },
      });
      const postIds = posts.map((p) => p.id);

      if (postIds.length > 0) {
        await tx.post.updateMany({
          where: { parentId: { in: postIds } },
          data: { parentId: null },
        });
        await tx.notification.deleteMany({ where: { postId: { in: postIds } } });
        await tx.reaction.deleteMany({ where: { postId: { in: postIds } } });
        await tx.attachment.deleteMany({ where: { postId: { in: postIds } } });
      }

      const messages = await tx.message.findMany({
        where: { senderId: userId },
        select: { id: true },
      });
      const messageIds = messages.map((m) => m.id);

      if (messageIds.length > 0) {
        await tx.notification.deleteMany({ where: { messageId: { in: messageIds } } });
        await tx.attachment.deleteMany({ where: { messageId: { in: messageIds } } });
      }

      await tx.notification.deleteMany({ where: { userId } });
      await tx.reaction.deleteMany({ where: { userId } });
      await tx.friendRequest.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      });
      await tx.user_Interest.deleteMany({ where: { userId } });
      await tx.user_Channel.deleteMany({ where: { userId } });
      await tx.player.deleteMany({ where: { userId } });
      await tx.message.deleteMany({ where: { senderId: userId } });
      await tx.post.deleteMany({ where: { authorId: userId } });
      await tx.fileAsset.deleteMany({ where: { ownerId: userId } });
      await tx.profile.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }

  async findAllChannels() {
    return this.prisma.channel.findMany({
      include: {
        interest: { select: { id: true, name: true, color: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async createChannel(name: string, color: string) {
    if (typeof name !== 'string' || typeof color !== 'string' || !name.trim() || !color.trim()) {
      throw new BadRequestException('name and color must be non-empty strings');
    }
    if (name.length > 50) {
      throw new BadRequestException('name must be 50 characters or less');
    }

    const existing = await this.prisma.interest.findUnique({ where: { name } });
    if (existing) throw new ConflictException(`Channel "${name}" already exists`);

    const interest = await this.prisma.interest.create({
      data: { name, color, parentId: null },
    });

    return this.prisma.channel.create({
      data: { interestId: interest.id },
      include: { interest: true },
    });
  }

  async deleteChannel(channelId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('Channel not found');

    await this.prisma.user_Channel.deleteMany({ where: { channelId } });
    await this.prisma.user_Interest.deleteMany({
      where: { interestId: channel.interestId },
    });
    await this.prisma.channel.delete({ where: { id: channelId } });
    await this.prisma.interest.delete({ where: { id: channel.interestId } });
  }

  async addUserToChannel(userId: string, channelId: number) {
    const [channel, user] = await Promise.all([
      this.prisma.channel.findUnique({ where: { id: channelId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!channel) throw new NotFoundException('Channel not found');
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user_Interest.upsert({
      where: { userId_interestId: { userId, interestId: channel.interestId } },
      create: { userId, interestId: channel.interestId },
      update: {},
    });

    return this.prisma.user_Channel.upsert({
      where: { userId_channelId: { userId, channelId } },
      create: { userId, channelId, isFavorite: false },
      update: {},
    });
  }

  async removeUserFromChannel(userId: string, channelId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('Channel not found');

    await this.prisma.user_Channel.deleteMany({ where: { userId, channelId } });
    await this.prisma.user_Interest.deleteMany({
      where: { userId, interestId: channel.interestId },
    });
  }

  private async assertCanModerateUser(requesterId: string, userId: string) {
    if (requesterId === userId) {
      throw new ForbiddenException('Cannot moderate your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot moderate another admin account');
    }
  }

  private normalizeReason(reason?: string): string | null {
    const normalizedReason = reason?.trim();
    return normalizedReason ? normalizedReason.slice(0, 500) : null;
  }

  private async getFriendCounts(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const userIdSet = new Set(userIds);
    const counts = new Map(userIds.map((userId) => [userId, 0]));
    const friendRequests = await this.prisma.friendRequest.findMany({
      where: {
        status: 'Accepted',
        OR: [
          { senderId: { in: userIds } },
          { receiverId: { in: userIds } },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    for (const request of friendRequests) {
      if (userIdSet.has(request.senderId)) {
        counts.set(request.senderId, (counts.get(request.senderId) ?? 0) + 1);
      }
      if (userIdSet.has(request.receiverId)) {
        counts.set(request.receiverId, (counts.get(request.receiverId) ?? 0) + 1);
      }
    }

    return counts;
  }
}

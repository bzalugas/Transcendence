import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        login: true,
        name: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            firstname: true,
            lastname: true,
            pseudo: true,
            avatarUri: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
}

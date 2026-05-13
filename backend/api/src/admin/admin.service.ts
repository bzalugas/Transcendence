import { Injectable, NotFoundException } from '@nestjs/common';
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

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id: userId } });
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

    await this.prisma.channel.delete({ where: { id: channelId } });
    await this.prisma.interest.delete({ where: { id: channel.interestId } });
  }

  async addUserToChannel(userId: string, channelId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('Channel not found');

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

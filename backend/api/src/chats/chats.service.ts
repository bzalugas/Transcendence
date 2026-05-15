import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ChatType, MessageType } from '@prisma/client';
import { BlocksService } from '../blocks/blocks.service';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatDto {
  id: number;
  name: string;
  type: ChatType;
  channel?: {
    id: number;
    slug: string;
    label: string;
    color: string;
    imageUri: string | null;
  };
  users: ChatUserDto[];
  lastMessage?: MessageDto;
}

export interface ChatUserDto {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
}

export interface MessageDto {
  id: number;
  chatId: number;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: string;
  sender: ChatUserDto;
}

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocksService: BlocksService,
  ) {}

  async findAccessibleChats(userId: string): Promise<ChatDto[]> {
    const joinedChannelIds = await this.findJoinedChannelIds(userId);
    const blockedUserIds = new Set(
      await this.blocksService.getBlockedPairUserIds(userId),
    );
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          {
            type: 'Private',
            users: {
              some: {
                id: userId,
              },
            },
          },
          {
            type: 'Interest',
            channelId: {
              in: joinedChannelIds,
            },
          },
        ],
      },
      include: this.chatInclude(),
      orderBy: {
        id: 'asc',
      },
    });

    return chats
      .filter(
        (chat) =>
          chat.type !== 'Private' ||
          chat.users.every(
            (participant) =>
              participant.id === userId || !blockedUserIds.has(participant.id),
          ),
      )
      .map((chat) => this.toChatDto(chat));
  }

  async findMessages(userId: string, chatId: number): Promise<MessageDto[]> {
    await this.assertChatAccess(userId, chatId);

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
      },
      include: this.messageInclude(),
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages.map((message) => this.toMessageDto(message));
  }

  async findOrCreateChannelChat(
    userId: string,
    slug: string,
  ): Promise<ChatDto> {
    const channel = await this.findChannelBySlug(slug);
    await this.assertChannelMembership(userId, channel.id);

    const chat = await this.prisma.chat.upsert({
      where: {
        channelId: channel.id,
      },
      create: {
        name: `${channel.interest.name} chats`,
        type: 'Interest',
        channelId: channel.id,
      },
      update: {},
      include: this.chatInclude(),
    });

    return this.toChatDto(chat);
  }

  async findOrCreatePrivateChat(
    userId: string,
    otherUserId: string,
    name?: string,
  ): Promise<ChatDto> {
    if (userId === otherUserId) {
      throw new BadRequestException(
        'Cannot create a private chat with yourself',
      );
    }

    const [currentUser, otherUser] = await Promise.all([
      this.findUserForChat(userId),
      this.findUserForChat(otherUserId),
    ]);

    if (await this.blocksService.isBlockedBetween(userId, otherUserId)) {
      throw new ForbiddenException('This private chat is blocked');
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: 'Private',
        users: {
          every: {
            id: {
              in: [userId, otherUserId],
            },
          },
        },
      },
      include: this.chatInclude(),
    });

    if (existingChat && existingChat.users.length === 2) {
      return this.toChatDto(existingChat);
    }

    const chatName =
      name?.trim() ||
      `${this.userDisplayName(currentUser)} / ${this.userDisplayName(otherUser)}`;

    const chat = await this.prisma.chat.create({
      data: {
        name: chatName,
        type: 'Private',
        users: {
          connect: [{ id: userId }, { id: otherUserId }],
        },
      },
      include: this.chatInclude(),
    });

    return this.toChatDto(chat);
  }

  async createMessage(
    userId: string,
    chatId: number,
    content?: string,
  ): Promise<MessageDto> {
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      throw new BadRequestException('Message content is required');
    }

    await this.assertChatAccess(userId, chatId);

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: trimmedContent,
      },
      include: this.messageInclude(),
    });

    return this.toMessageDto(message);
  }

  async assertChatAccess(userId: string, chatId: number): Promise<void> {
    const chat = await this.prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.type === 'Interest') {
      if (!chat.channelId) {
        throw new ForbiddenException('Channel chat is not available');
      }

      await this.assertChannelMembership(userId, chat.channelId);
      return;
    }

    const participantIds = chat.users.map((participant) => participant.id);

    if (!participantIds.includes(userId)) {
      throw new ForbiddenException('Chat access denied');
    }

    if (chat.type === 'Private') {
      for (const participantId of participantIds) {
        if (
          participantId !== userId &&
          (await this.blocksService.isBlockedBetween(userId, participantId))
        ) {
          throw new ForbiddenException('This private chat is blocked');
        }
      }
    }
  }

  private async findJoinedChannelIds(userId: string): Promise<number[]> {
    const memberships = await this.prisma.user_Channel.findMany({
      where: {
        userId,
      },
      select: {
        channelId: true,
      },
    });

    return memberships.map((membership) => membership.channelId);
  }

  private async assertChannelMembership(
    userId: string,
    channelId: number,
  ): Promise<void> {
    const membership = await this.prisma.user_Channel.findUnique({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Join the channel before using its chats');
    }
  }

  private async findChannelBySlug(slug: string) {
    const channels = await this.prisma.channel.findMany({
      include: {
        interest: true,
      },
    });
    const channel = channels.find(
      (candidate) => this.toSlug(candidate.interest.name) === slug,
    );

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  private async findUserForChat(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private chatInclude() {
    return {
      channel: {
        include: {
          interest: true,
        },
      },
      users: {
        include: {
          profile: true,
        },
      },
      messages: {
        include: this.messageInclude(),
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    } as const;
  }

  private messageInclude() {
    return {
      sender: {
        include: {
          profile: true,
        },
      },
    } as const;
  }

  private toChatDto(chat: {
    id: number;
    name: string;
    type: ChatType;
    channel: {
      id: number;
      interest: {
        name: string;
        color: string | null;
        imageUri: string | null;
      };
    } | null;
    users: ChatUserRecord[];
    messages: MessageRecord[];
  }): ChatDto {
    const lastMessage = chat.messages[0];

    return {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      channel: chat.channel
        ? {
            id: chat.channel.id,
            slug: this.toSlug(chat.channel.interest.name),
            label: chat.channel.interest.name,
            color: chat.channel.interest.color ?? '#6B7280',
            imageUri: chat.channel.interest.imageUri,
          }
        : undefined,
      users: chat.users.map((user) => this.toUserDto(user)),
      lastMessage: lastMessage ? this.toMessageDto(lastMessage) : undefined,
    };
  }

  private toMessageDto(message: MessageRecord): MessageDto {
    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt.toISOString(),
      sender: this.toUserDto(message.sender),
    };
  }

  private toUserDto(user: ChatUserRecord): ChatUserDto {
    const username = this.userDisplayName(user);

    return {
      id: user.id,
      username,
      initials: this.initials(username),
      avatarUrl: user.profile?.avatarUri ?? user.image ?? undefined,
    };
  }

  private toSlug(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private userDisplayName(user: {
    login: string | null;
    name: string | null;
    email: string;
  }): string {
    return user.login ?? user.name ?? user.email.split('@')[0];
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

interface ChatUserRecord {
  id: string;
  login: string | null;
  name: string | null;
  email: string;
  image: string | null;
  profile: {
    avatarUri: string | null;
  } | null;
}

interface MessageRecord {
  id: number;
  chatId: number;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: Date;
  sender: ChatUserRecord;
}

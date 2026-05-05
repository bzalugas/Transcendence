import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChannelDto {
  id: number;
  interestId: number;
  slug: string;
  label: string;
  color: string;
  imageUri: string | null;
  memberCount: number;
  postCount: number;
  joined?: boolean;
  isFavorite?: boolean;
}

export interface ChannelMemberDto {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  level: number;
  joinedAt: string;
  isFavorite: boolean;
}

export interface ChannelPostDto {
  id: string;
  initials: string;
  avatarUrl?: string;
  author: string;
  time: string;
  channelSlug: string;
  channelLabel: string;
  body: string;
  likeCount: number;
  liked: boolean;
  comments: ChannelCommentDto[];
}

export interface ChannelCommentDto {
  id: string;
  initials: string;
  avatarUrl?: string;
  author: string;
  text: string;
  time: string;
}

export type ChannelFeedItemDto = { kind: 'post'; post: ChannelPostDto };

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  // Reads all channels with their interest metadata and aggregate counts.
  async findAll(): Promise<ChannelDto[]> {
    const channels = await this.prisma.channel.findMany({
      include: this.channelInclude(),
    });

    return channels
      .map((channel) => this.toChannelDto(channel))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Reads channels joined by one user through the User_Channel relation.
  async findJoinedForUser(userId: string): Promise<ChannelDto[]> {
    const joinedChannels = await this.prisma.user_Channel.findMany({
      where: { userId },
      include: {
        channel: {
          include: this.channelInclude(),
        },
      },
    });

    return joinedChannels
      .map((joinedChannel) =>
        this.toChannelDto(joinedChannel.channel, {
          joined: true,
          isFavorite: joinedChannel.isFavorite,
        }),
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Finds one channel from the public slug derived from its interest name.
  async findBySlug(slug: string): Promise<ChannelDto> {
    const channel = await this.findChannelBySlug(slug);
    return this.toChannelDto(channel);
  }

  // Lists users who joined the channel identified by slug.
  async findMembersBySlug(slug: string): Promise<ChannelMemberDto[]> {
    const channel = await this.findChannelBySlug(slug);
    const memberships = await this.prisma.user_Channel.findMany({
      where: { channelId: channel.id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return memberships.map((membership) => ({
      id: membership.user.id,
      username: this.userDisplayName(membership.user),
      initials: this.initials(this.userDisplayName(membership.user)),
      avatarUrl: membership.user.profile?.avatarUri ?? membership.user.image ?? undefined,
      level: membership.user.profile?.level ?? 0,
      joinedAt: membership.joinedAt.toISOString(),
      isFavorite: membership.isFavorite,
    }));
  }

  // Reads persisted root posts for a channel and formats them for the feed UI.
  async findFeedBySlug(slug: string): Promise<ChannelFeedItemDto[]> {
    const channel = await this.findChannelBySlug(slug);
    const posts = await this.prisma.post.findMany({
      where: {
        channelId: channel.id,
        parentId: null,
      },
      include: this.postInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });

    return posts.map((post) => ({
      kind: 'post',
      post: this.toPostDto(post, channel),
    }));
  }

  // Persists a new root post in a channel for one authenticated user.
  async createPostBySlug(
    userId: string,
    slug: string,
    content?: string,
  ): Promise<ChannelPostDto> {
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      throw new BadRequestException('Post content is required');
    }

    const channel = await this.findChannelBySlug(slug);
    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        channelId: channel.id,
        content: trimmedContent,
      },
      include: this.postInclude(),
    });

    return this.toPostDto(post, channel);
  }

  // Persists a reply to an existing post in the same channel.
  async createReplyBySlug(
    userId: string,
    slug: string,
    postId: number,
    content?: string,
  ): Promise<ChannelCommentDto> {
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      throw new BadRequestException('Reply content is required');
    }

    const channel = await this.findChannelBySlug(slug);
    const parentPost = await this.prisma.post.findFirst({
      where: {
        id: postId,
        channelId: channel.id,
      },
    });

    if (!parentPost) {
      throw new NotFoundException('Post not found');
    }

    const reply = await this.prisma.post.create({
      data: {
        authorId: userId,
        channelId: channel.id,
        parentId: parentPost.id,
        content: trimmedContent,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.toCommentDto(reply);
  }

  // Joins both the channel and its owning interest for one user.
  async joinBySlug(userId: string, slug: string): Promise<ChannelDto> {
    const channel = await this.findChannelBySlug(slug);

    await this.prisma.user_Interest.upsert({
      where: {
        userId_interestId: {
          userId,
          interestId: channel.interestId,
        },
      },
      create: {
        userId,
        interestId: channel.interestId,
      },
      update: {},
    });

    const membership = await this.prisma.user_Channel.upsert({
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

    return this.toChannelDto(channel, {
      joined: true,
      isFavorite: membership.isFavorite,
    });
  }

  // Leaves both the channel and its owning interest for one user.
  async leaveBySlug(userId: string, slug: string): Promise<{ left: true }> {
    const channel = await this.findChannelBySlug(slug);

    await this.prisma.user_Channel.deleteMany({
      where: {
        userId,
        channelId: channel.id,
      },
    });

    await this.prisma.user_Interest.deleteMany({
      where: {
        userId,
        interestId: channel.interestId,
      },
    });

    return { left: true };
  }

  // Finds a channel by comparing the requested slug to each interest-name slug.
  private async findChannelBySlug(slug: string) {
    const channels = await this.prisma.channel.findMany({
      include: this.channelInclude(),
    });
    const channel = channels.find(
      (candidate) => this.toSlug(candidate.interest.name) === slug,
    );

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  // Builds the shared Prisma include used by channel read queries.
  private channelInclude() {
    return {
      interest: true,
      _count: {
        select: {
          users: true,
          posts: true,
        },
      },
    } as const;
  }

  // Builds the shared Prisma include used by channel feed queries.
  private postInclude() {
    return {
      author: {
        include: {
          profile: true,
        },
      },
      reactions: true,
      children: {
        include: {
          author: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    } as const;
  }

  // Converts a Prisma channel record into the API shape consumed by the frontend.
  private toChannelDto(
    channel: {
      id: number;
      interestId: number;
      interest: {
        name: string;
        color: string | null;
        imageUri: string | null;
      };
      _count: {
        users: number;
        posts: number;
      };
    },
    membership?: { joined?: boolean; isFavorite?: boolean },
  ): ChannelDto {
    return {
      id: channel.id,
      interestId: channel.interestId,
      slug: this.toSlug(channel.interest.name),
      label: channel.interest.name,
      color: channel.interest.color ?? '#6B7280',
      imageUri: channel.interest.imageUri,
      memberCount: channel._count.users,
      postCount: channel._count.posts,
      ...membership,
    };
  }

  // Converts a Prisma post record into the feed post shape consumed by the frontend.
  private toPostDto(
    post: {
      id: number;
      createdAt: Date;
      content: string;
      author: {
        login: string | null;
        name: string | null;
        email: string;
        image: string | null;
        profile: {
          avatarUri: string | null;
        } | null;
      };
      reactions: unknown[];
      children: Array<{
        id: number;
        createdAt: Date;
        content: string;
        author: {
          login: string | null;
          name: string | null;
          email: string;
          image: string | null;
          profile: {
            avatarUri: string | null;
          } | null;
        };
      }>;
    },
    channel: {
      interest: {
        name: string;
      };
    },
  ): ChannelPostDto {
    const author = this.userDisplayName(post.author);

    return {
      id: String(post.id),
      initials: this.initials(author),
      avatarUrl: post.author.profile?.avatarUri ?? post.author.image ?? undefined,
      author,
      time: this.relativeTime(post.createdAt),
      channelSlug: this.toSlug(channel.interest.name),
      channelLabel: channel.interest.name,
      body: post.content,
      likeCount: post.reactions.length,
      liked: false,
      comments: post.children.map((comment) => {
        return this.toCommentDto(comment);
      }),
    };
  }

  // Converts a Prisma child post into the frontend comment shape.
  private toCommentDto(comment: {
    id: number;
    createdAt: Date;
    content: string;
    author: {
      login: string | null;
      name: string | null;
      email: string;
      image: string | null;
      profile: {
        avatarUri: string | null;
      } | null;
    };
  }): ChannelCommentDto {
    const commentAuthor = this.userDisplayName(comment.author);

    return {
      id: String(comment.id),
      initials: this.initials(commentAuthor),
      avatarUrl: comment.author.profile?.avatarUri ?? comment.author.image ?? undefined,
      author: commentAuthor,
      text: comment.content,
      time: this.relativeTime(comment.createdAt),
    };
  }

  // Converts an interest name into the stable public channel slug.
  private toSlug(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Chooses the best display name available for a channel member.
  private userDisplayName(user: {
    login: string | null;
    name: string | null;
    email: string;
  }): string {
    return user.login ?? user.name ?? user.email.split('@')[0];
  }

  // Builds compact initials from a display name for avatar fallbacks.
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

  // Formats a creation date into a compact relative label for feed cards.
  private relativeTime(date: Date): string {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (elapsedSeconds < 60) return 'just now';

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) return `${elapsedDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

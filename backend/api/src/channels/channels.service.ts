import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AttachmentType, FileCategory } from '@prisma/client';
import { FilesService } from '../files/files.service';
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
  isFriend: boolean;
}

export interface ChannelPostDto {
  id: string;
  createdAt: string;
  authorId: string;
  initials: string;
  avatarUrl?: string;
  author: string;
  time: string;
  channelSlug: string;
  channelLabel: string;
  body: string;
  likeCount: number;
  liked: boolean;
  attachments: ChannelPostAttachmentDto[];
  comments: ChannelCommentDto[];
}

export interface ChannelPostAttachmentDto {
  id: string;
  fileId: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  type: AttachmentType;
  previewUrl: string;
  downloadUrl: string;
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  // Reads all channels with their interest metadata and root post counts.
  async findAll(): Promise<ChannelDto[]> {
    const channels = await this.prisma.channel.findMany({
      include: this.channelInclude(),
    });
    const rootPostCounts = await this.getRootPostCounts(channels.map((channel) => channel.id));

    return channels
      .map((channel) => this.toChannelDto(channel, undefined, rootPostCounts.get(channel.id) ?? 0))
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
    const rootPostCounts = await this.getRootPostCounts(
      joinedChannels.map((joinedChannel) => joinedChannel.channel.id),
    );

    return joinedChannels
      .map((joinedChannel) =>
        this.toChannelDto(joinedChannel.channel, {
          joined: true,
          isFavorite: joinedChannel.isFavorite,
        }, rootPostCounts.get(joinedChannel.channel.id) ?? 0),
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Finds one channel from the public slug derived from its interest name.
  async findBySlug(slug: string): Promise<ChannelDto> {
    const channel = await this.findChannelBySlug(slug);
    return this.toChannelDto(channel, undefined, await this.countRootPosts(channel.id));
  }

  // Lists users who joined the channel identified by slug.
  async findMembersBySlug(
    slug: string,
    currentUserId: string,
  ): Promise<ChannelMemberDto[]> {
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
    const friendIds = await this.getAcceptedFriendIds(currentUserId);
    const friendIdSet = new Set(friendIds);

    return memberships.map((membership) => ({
      id: membership.user.id,
      username: this.userDisplayName(membership.user),
      initials: this.initials(this.userDisplayName(membership.user)),
      avatarUrl: membership.user.profile?.avatarUri ?? membership.user.image ?? undefined,
      level: membership.user.profile?.level ?? 0,
      joinedAt: membership.joinedAt.toISOString(),
      isFavorite: membership.isFavorite,
      isFriend: friendIdSet.has(membership.user.id),
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
    attachmentIds?: number[],
  ): Promise<ChannelPostDto> {
    const trimmedContent = content?.trim();
    const fileAssets = await this.findAttachableFiles(userId, attachmentIds);

    if (!trimmedContent && fileAssets.length === 0) {
      throw new BadRequestException('Post content or attachment is required');
    }

    const channel = await this.findChannelBySlug(slug);
    await this.assertChannelMembership(userId, channel.id);

    const post = await this.prisma.$transaction(async (tx) => {
      const createdPost = await tx.post.create({
        data: {
          authorId: userId,
          channelId: channel.id,
          content: trimmedContent ?? '',
          attachments: fileAssets.length
            ? {
                create: fileAssets.map((file) => ({
                  fileId: file.id,
                  type: file.attachmentType,
                })),
              }
            : undefined,
        },
        include: this.postInclude(),
      });

      if (fileAssets.length > 0) {
        await tx.fileAsset.updateMany({
          where: {
            id: {
              in: fileAssets.map((file) => file.id),
            },
          },
          data: {
            status: 'attached',
          },
        });
      }

      return createdPost;
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
    await this.assertChannelMembership(userId, channel.id);

    const parentPost = await this.prisma.post.findFirst({
      where: {
        id: postId,
        channelId: channel.id,
      },
    });

    if (!parentPost) {
      throw new NotFoundException('Post not found');
    }

    if (parentPost.parentId !== null) {
      throw new BadRequestException('Cannot reply to a reply');
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

  // Replaces a root post's text and full attachment list for the original author.
  async updatePostBySlug(
    userId: string,
    slug: string,
    postId: number,
    content?: string,
    attachmentIds?: number[],
  ): Promise<ChannelPostDto> {
    const trimmedContent = content?.trim();
    const nextFileIds = this.validateAttachmentIds(attachmentIds);

    if (!trimmedContent && nextFileIds.length === 0) {
      throw new BadRequestException('Post content or attachment is required');
    }

    const channel = await this.findChannelBySlug(slug);
    const existingPost = await this.prisma.post.findFirst({
      where: {
        id: postId,
        channelId: channel.id,
      },
      include: {
        attachments: {
          include: {
            file: {
              select: {
                id: true,
                storageKey: true,
              },
            },
          },
        },
      },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    if (existingPost.parentId !== null) {
      throw new BadRequestException('Cannot edit a reply from this endpoint');
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('Only the post author can edit it');
    }

    const fileAssets = await this.findEditableFiles(
      userId,
      existingPost.id,
      nextFileIds,
    );
    const nextFileIdSet = new Set(nextFileIds);
    const removedAttachments = existingPost.attachments.filter(
      (attachment) => !nextFileIdSet.has(attachment.fileId),
    );
    const removedFileIds = removedAttachments.map((attachment) => attachment.fileId);
    const removedStorageKeys = removedAttachments.map((attachment) => attachment.file.storageKey);

    const updatedPost = await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: existingPost.id },
        data: { content: trimmedContent ?? '' },
      });

      if (removedFileIds.length > 0) {
        await tx.fileAsset.deleteMany({
          where: {
            id: {
              in: removedFileIds,
            },
          },
        });
      }

      await tx.attachment.deleteMany({
        where: {
          postId: existingPost.id,
        },
      });

      if (fileAssets.length > 0) {
        await tx.attachment.createMany({
          data: fileAssets.map((file) => ({
            postId: existingPost.id,
            fileId: file.id,
            type: file.attachmentType,
          })),
        });

        await tx.fileAsset.updateMany({
          where: {
            id: {
              in: fileAssets.map((file) => file.id),
            },
          },
          data: {
            status: 'attached',
          },
        });
      }

      return tx.post.findUnique({
        where: { id: existingPost.id },
        include: this.postInclude(),
      });
    });

    if (!updatedPost) {
      throw new NotFoundException('Post not found');
    }

    await this.filesService.deleteStorageKeys(removedStorageKeys);

    return this.toPostDto(updatedPost, channel);
  }

  // Deletes a root post and its comments when requested by the original author.
  async deletePostBySlug(
    userId: string,
    slug: string,
    postId: number,
  ): Promise<{ deleted: true }> {
    const channel = await this.findChannelBySlug(slug);
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        channelId: channel.id,
      },
      select: {
        id: true,
        authorId: true,
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

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.parentId !== null) {
      throw new BadRequestException('Cannot remove a reply from this endpoint');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('Only the post author can remove it');
    }

    const postIds = [post.id, ...post.children.map((child) => child.id)];
    const storageKeys = post.attachments.map((attachment) => attachment.file.storageKey);
    const fileIds = post.attachments.map((attachment) => attachment.fileId);

    await this.prisma.$transaction([
      this.prisma.reaction.deleteMany({
        where: {
          postId: {
            in: postIds,
          },
        },
      }),
      this.prisma.fileAsset.deleteMany({
        where: {
          id: {
            in: fileIds,
          },
        },
      }),
      this.prisma.notification.deleteMany({
        where: {
          postId: {
            in: postIds,
          },
        },
      }),
      this.prisma.post.deleteMany({
        where: {
          id: {
            in: post.children.map((child) => child.id),
          },
        },
      }),
      this.prisma.post.delete({
        where: {
          id: post.id,
        },
      }),
    ]);
    await this.filesService.deleteStorageKeys(storageKeys);

    return { deleted: true };
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
    }, await this.countRootPosts(channel.id));
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

  // Ensures a user joined a channel before allowing write actions.
  private async assertChannelMembership(userId: string, channelId: number): Promise<void> {
    const membership = await this.prisma.user_Channel.findUnique({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Join the channel before posting');
    }
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
        },
      },
    } as const;
  }

  // Counts only top-level channel posts, excluding replies/comments.
  private async countRootPosts(channelId: number): Promise<number> {
    return this.prisma.post.count({
      where: {
        channelId,
        parentId: null,
      },
    });
  }

  // Counts top-level posts for a set of channels in one grouped query.
  private async getRootPostCounts(channelIds: number[]): Promise<Map<number, number>> {
    if (channelIds.length === 0) return new Map();

    const counts = await this.prisma.post.groupBy({
      by: ['channelId'],
      where: {
        channelId: {
          in: channelIds,
        },
        parentId: null,
      },
      _count: {
        _all: true,
      },
    });

    return new Map(counts.map((count) => [count.channelId, count._count._all]));
  }

  // Finds ids connected to one user by accepted FriendRequest rows.
  private async getAcceptedFriendIds(userId: string): Promise<string[]> {
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

  // Builds the shared Prisma include used by channel feed queries.
  private postInclude() {
    return {
      author: {
        include: {
          profile: true,
        },
      },
      reactions: true,
      attachments: {
        include: {
          file: true,
        },
      },
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
      };
    },
    membership?: { joined?: boolean; isFavorite?: boolean },
    rootPostCount = 0,
  ): ChannelDto {
    return {
      id: channel.id,
      interestId: channel.interestId,
      slug: this.toSlug(channel.interest.name),
      label: channel.interest.name,
      color: channel.interest.color ?? '#6B7280',
      imageUri: channel.interest.imageUri,
      memberCount: channel._count.users,
      postCount: rootPostCount,
      ...membership,
    };
  }

  // Converts a Prisma post record into the feed post shape consumed by the frontend.
  private toPostDto(
    post: {
      id: number;
      createdAt: Date;
      content: string;
      authorId: string;
      attachments: Array<{
        id: number;
        type: AttachmentType;
        fileId: number;
        file: {
          id: number;
          originalName: string;
          mimeType: string;
          sizeBytes: number;
          category: FileCategory;
          attachmentType: AttachmentType;
        };
      }>;
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
      createdAt: post.createdAt.toISOString(),
      authorId: post.authorId,
      initials: this.initials(author),
      avatarUrl: post.author.profile?.avatarUri ?? post.author.image ?? undefined,
      author,
      time: this.relativeTime(post.createdAt),
      channelSlug: this.toSlug(channel.interest.name),
      channelLabel: channel.interest.name,
      body: post.content,
      likeCount: post.reactions.length,
      liked: false,
      attachments: post.attachments.map((attachment) => ({
        id: String(attachment.id),
        fileId: attachment.fileId,
        originalName: attachment.file.originalName,
        mimeType: attachment.file.mimeType,
        sizeBytes: attachment.file.sizeBytes,
        category: attachment.file.category,
        type: attachment.type,
        previewUrl: `/files/${attachment.file.id}/preview`,
        downloadUrl: `/files/${attachment.file.id}/download`,
      })),
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

  // Verifies uploaded files belong to the author and are not already attached elsewhere.
  private async findAttachableFiles(userId: string, attachmentIds?: number[]) {
    const uniqueIds = this.validateAttachmentIds(attachmentIds);

    const files = await this.prisma.fileAsset.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
        ownerId: userId,
        status: 'uploaded',
      },
      include: {
        attachments: true,
      },
    });

    if (files.length !== uniqueIds.length || files.some((file) => file.attachments.length > 0)) {
      throw new BadRequestException('One or more files cannot be attached');
    }

    return files;
  }

  private async findEditableFiles(
    userId: string,
    postId: number,
    attachmentIds: number[],
  ) {
    const files = await this.prisma.fileAsset.findMany({
      where: {
        id: {
          in: attachmentIds,
        },
        ownerId: userId,
      },
      include: {
        attachments: true,
      },
    });

    const orderedFiles = attachmentIds
      .map((id) => files.find((file) => file.id === id))
      .filter((file): file is NonNullable<typeof file> => Boolean(file));

    const allFilesCanBeUsed =
      orderedFiles.length === attachmentIds.length &&
      orderedFiles.every((file) =>
        file.status === 'uploaded'
          ? file.attachments.length === 0
          : file.status === 'attached' &&
            file.attachments.some((attachment) => attachment.postId === postId),
      );

    if (!allFilesCanBeUsed) {
      throw new BadRequestException('One or more files cannot be attached');
    }

    return orderedFiles;
  }

  private validateAttachmentIds(attachmentIds?: number[]): number[] {
    if (!attachmentIds) return [];
    if (!Array.isArray(attachmentIds)) {
      throw new BadRequestException('Post attachment ids must be a list');
    }
    if (attachmentIds.length > 4) {
      throw new BadRequestException('Only four post attachments are supported');
    }

    const uniqueIds = Array.from(new Set(attachmentIds));
    if (uniqueIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new BadRequestException('Post attachment ids are invalid');
    }

    return uniqueIds;
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

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { auth } from '../../lib/auth';
import { ChannelsService, type ChannelPostDto } from './channels.service';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    userId?: string;
  };
}

@WebSocketGateway({
  path: '/api/socket.io',
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:8080',
    credentials: true,
  },
})
export class ChannelsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly channelsService: ChannelsService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      client.data.userId = await this.getSocketUserId(client);
    } catch {
      client.emit('channel:error', { message: 'Authentication required' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('channel:join')
  async joinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { slug?: string },
  ) {
    try {
      const userId = this.requireSocketUserId(client);
      const slug = this.parseSlug(payload?.slug);
      await this.channelsService.assertChannelAccessBySlug(userId, slug);
      await client.join(this.channelRoom(slug));
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('channel:leave')
  async leaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { slug?: string },
  ) {
    try {
      const slug = this.parseSlug(payload?.slug);
      await client.leave(this.channelRoom(slug));
    } catch (error) {
      this.emitError(client, error);
    }
  }

  emitPost(slug: string, post: ChannelPostDto) {
    this.server.to(this.channelRoom(slug)).emit('channel:post', {
      slug,
      post,
    });
  }

  private async getSocketUserId(client: Socket): Promise<string> {
    const session = await auth.api.getSession({
      headers: this.toHeaders(client),
    });

    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    return session.user.id;
  }

  private toHeaders(client: Socket): Headers {
    const headers = new Headers();

    for (const [key, value] of Object.entries(client.handshake.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    }

    return headers;
  }

  private requireSocketUserId(client: AuthenticatedSocket): string {
    if (!client.data.userId) {
      throw new Error('Authentication required');
    }

    return client.data.userId;
  }

  private parseSlug(slug?: string): string {
    const parsedSlug = slug?.trim();
    if (!parsedSlug) {
      throw new Error('Channel slug is required');
    }

    return parsedSlug;
  }

  private channelRoom(slug: string): string {
    return `channel:${slug}`;
  }

  private emitError(client: Socket, error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to process channel event';
    client.emit('channel:error', { message });
  }
}

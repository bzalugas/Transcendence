import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { auth } from '../../lib/auth';
import type { FriendRequestDto } from './friendships.service';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    userId?: string;
  };
}

@WebSocketGateway({
  path: '/api/socket.io',
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'https://localhost',
    credentials: true,
  },
})
export class FriendshipsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server;

  async handleConnection(client: AuthenticatedSocket) {
    try {
      client.data.userId = await this.getSocketUserId(client);
      await client.join(this.userRoom(client.data.userId));
    } catch {
      client.emit('friendship:error', { message: 'Authentication required' });
      client.disconnect(true);
    }
  }

  emitReceivedRequest(receiverId: string, request: FriendRequestDto) {
    this.server.to(this.userRoom(receiverId)).emit('friendship:request', request);
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

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
}

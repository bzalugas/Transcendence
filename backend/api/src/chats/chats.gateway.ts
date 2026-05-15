import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { auth } from '../../lib/auth';
import { ChatsService } from './chats.service';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    userId?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:8080',
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(private readonly chatsService: ChatsService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      client.data.userId = await this.getSocketUserId(client);
    } catch {
      client.emit('chat:error', { message: 'Authentication required' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('chat:join')
  async joinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { chatId?: number | string },
  ) {
    try {
      const userId = this.requireSocketUserId(client);
      const chatId = this.parseChatId(payload?.chatId);
      await this.chatsService.assertChatAccess(userId, chatId);
      await client.join(this.chatRoom(chatId));
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('chat:leave')
  async leaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { chatId?: number | string },
  ) {
    try {
      const chatId = this.parseChatId(payload?.chatId);
      await client.leave(this.chatRoom(chatId));
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('chat:message')
  async createMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { chatId?: number | string; content?: string },
  ) {
    try {
      const userId = this.requireSocketUserId(client);
      const chatId = this.parseChatId(payload?.chatId);
      const message = await this.chatsService.createMessage(
        userId,
        chatId,
        payload?.content,
      );

      client.to(this.chatRoom(chatId)).emit('chat:message', message);
      client.emit('chat:message', message);
    } catch (error) {
      this.emitError(client, error);
    }
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

  private parseChatId(chatId?: number | string): number {
    const parsedChatId = typeof chatId === 'string' ? Number(chatId) : chatId;

    if (
      typeof parsedChatId !== 'number' ||
      !Number.isInteger(parsedChatId) ||
      parsedChatId <= 0
    ) {
      throw new Error('Valid chatId is required');
    }

    return parsedChatId;
  }

  private chatRoom(chatId: number): string {
    return `chat:${chatId}`;
  }

  private emitError(client: Socket, error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unable to process chat event';
    client.emit('chat:error', { message });
  }
}

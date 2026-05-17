import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlocksModule } from '../blocks/blocks.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsGateway } from './friendships.gateway';
import { FriendshipsService } from './friendships.service';

@Module({
  imports: [PrismaModule, BlocksModule],
  controllers: [FriendshipsController],
  providers: [FriendshipsService, FriendshipsGateway],
})
export class FriendshipsModule {}

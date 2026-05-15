import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlocksModule } from '../blocks/blocks.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';

@Module({
  imports: [PrismaModule, BlocksModule],
  controllers: [FriendshipsController],
  providers: [FriendshipsService],
})
export class FriendshipsModule {}

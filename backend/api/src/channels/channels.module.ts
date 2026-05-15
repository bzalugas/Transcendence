import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';
import { BlocksModule } from '../blocks/blocks.module';
import { ChannelsController } from './channels.controller';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsService } from './channels.service';

@Module({
  imports: [PrismaModule, FilesModule, BlocksModule],
  controllers: [ChannelsController],
  providers: [ChannelsService, ChannelsGateway],
})
export class ChannelsModule {}

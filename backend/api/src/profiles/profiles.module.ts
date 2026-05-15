import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlocksModule } from '../blocks/blocks.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [PrismaModule, BlocksModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}

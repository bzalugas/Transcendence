import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlocksModule } from '../blocks/blocks.module';
import { InterestsController } from './interests.controller';
import { InterestsService } from './interests.service';

@Module({
  imports: [PrismaModule, BlocksModule],
  controllers: [InterestsController],
  providers: [InterestsService],
})
export class InterestsModule {}

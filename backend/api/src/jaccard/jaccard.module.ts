import { Module } from '@nestjs/common';
import { BlocksModule } from '../blocks/blocks.module';
import { JaccardController } from './jaccard.controller';
import { JaccardService } from './jaccard.service';

@Module({
  imports: [BlocksModule],
  controllers: [JaccardController],
  providers: [JaccardService],
})
export class JaccardModule {}

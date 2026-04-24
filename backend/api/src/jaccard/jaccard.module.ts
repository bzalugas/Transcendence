import { Module } from '@nestjs/common';
import { JaccardController } from './jaccard.controller';
import { JaccardService } from './jaccard.service';

@Module({
    controllers: [JaccardController],
    providers: [JaccardService],
})
export class JaccardModule {}
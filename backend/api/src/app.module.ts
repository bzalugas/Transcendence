import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JaccardModule } from './jaccard/jaccard.module';

@Module({
  imports: [PrismaModule, JaccardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JaccardModule } from './jaccard/jaccard.module';
import { InterestsModule } from './interests/interests.module';
import { ChannelsModule } from './channels/channels.module';
import { ProfilesModule } from './profiles/profiles.module';
import { FriendshipsModule } from './friendships/friendships.module';

@Module({
  imports: [
    PrismaModule,
    JaccardModule,
    InterestsModule,
    ChannelsModule,
    ProfilesModule,
    FriendshipsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

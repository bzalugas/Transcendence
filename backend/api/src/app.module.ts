import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JaccardModule } from './jaccard/jaccard.module';
import { InterestsModule } from './interests/interests.module';
import { ChannelsModule } from './channels/channels.module';
import { ProfilesModule } from './profiles/profiles.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { FilesModule } from './files/files.module';
import { PrivacyModule } from './privacy/privacy.module';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { ProjectsModule } from './projects/projects.module';
import { BlocksModule } from './blocks/blocks.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    JaccardModule,
    InterestsModule,
    ChannelsModule,
    ProfilesModule,
    FriendshipsModule,
    BlocksModule,
    ChatsModule,
    FilesModule,
    ProjectsModule,
    PrivacyModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

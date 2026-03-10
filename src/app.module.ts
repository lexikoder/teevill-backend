import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config/env.config';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { JobModule } from './job/job.module';
import { ProposalModule } from './proposal/propsal.module';
import { NotificationModule } from './notification/notification.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [
    MongooseModule.forRoot(config.database.mongo_url),
    UserModule,
    ProjectModule,
    JobModule,
    ProposalModule,
    NotificationModule,
    ClientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

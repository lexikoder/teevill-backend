import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectController } from './controllers/project.controller';
import { ProjectService } from './services/project.service';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { Section, SectionSchema } from './schemas/section.schema';
import { Invite, InviteSchema } from './schemas/invite.schema';
import { MailService } from 'src/core/mail/email';
import { SectionController } from './controllers/section.controller';
import { SectionService } from './services/section.service';
import {
  SubTask,
  SubTaskSchema,
  Task,
  TaskSchema,
} from './schemas/task.schema';
import { TaskController } from './controllers/task.controller';
import { TaskService } from './services/task.service';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { NotificationService } from 'src/notification/services/notification.service';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Section.name, schema: SectionSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: Task.name, schema: TaskSchema },
      { name: SubTask.name, schema: SubTaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [ProjectController, SectionController, TaskController],
  providers: [
    ProjectService,
    MailService,
    SectionService,
    TaskService,
    CloudinaryService,
    NotificationService,
  ],
})
export class ProjectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(ProjectController, SectionController, TaskController);
  }
}

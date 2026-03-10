import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { Project, ProjectSchema } from 'src/project/schemas/project.schema';
import { DashboardController } from './controllers/dashboard.controller';
import { ProjectService } from 'src/project/services/project.service';
import { DashboardService } from './services/dashboard.service';
import { Section, SectionSchema } from 'src/project/schemas/section.schema';
import { Invite, InviteSchema } from 'src/project/schemas/invite.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/schemas/notification.schema';
import { NotificationService } from 'src/notification/services/notification.service';
import { MailService } from 'src/core/mail/email';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/schemas/transaction.schema';
import { Proposal, ProposalSchema } from 'src/proposal/schemas/proposal.schema';
import { Job, JobSchema } from 'src/job/schemas/job.schema';
import { JobService } from 'src/job/services/job.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Section.name, schema: SectionSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Proposal.name, schema: ProposalSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    ProjectService,
    DashboardService,
    NotificationService,
    MailService,
    JobService,
  ],
})
export class DashboardModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyTokenMiddleware).forRoutes(DashboardController);
  }
}

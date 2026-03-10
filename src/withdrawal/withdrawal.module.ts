import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { Withdrawal, WithdrawalSchema } from './schemas/withdrawal.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { WithdrawalController } from './controllers/withdrawal.controller';
import { WithdrawalService } from './services/withdrawal.service';
import { MailService } from 'src/core/mail/email';
import { NotificationService } from 'src/notification/services/notification.service';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/schemas/notification.schema';
import { Job, JobSchema } from 'src/job/schemas/job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [WithdrawalController],
  providers: [WithdrawalService, MailService, NotificationService],
})
export class WithdrawalModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyTokenMiddleware).forRoutes(WithdrawalController);
  }
}

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { MailService } from 'src/core/mail/email';
import { Question, QuestionSchema } from './schemas/question.schema';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import {
  QuestionTypeList,
  QuestionTypeListSchema,
} from './schemas/question-type.schema';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { Invite, InviteSchema } from 'src/project/schemas/invite.schema';
import { NotificationService } from 'src/notification/services/notification.service';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: QuestionTypeList.name, schema: QuestionTypeListSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, MailService, CloudinaryService, NotificationService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyTokenMiddleware).forRoutes(
      {
        path: 'api/v1/user/logged-in',
        method: RequestMethod.GET,
      },
      { path: 'api/v1/user/change-password', method: RequestMethod.POST },
      { path: 'api/v1/user/delete-account', method: RequestMethod.POST },
      { path: 'api/v1/user/visibility', method: RequestMethod.PUT },
      { path: 'api/v1/user/edit-profile/:id', method: RequestMethod.PUT },
    );
  }
}

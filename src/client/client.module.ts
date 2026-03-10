import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailService } from 'src/core/mail/email';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { Invite, InviteSchema } from 'src/project/schemas/invite.schema';
import { NotificationService } from 'src/notification/services/notification.service';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/schemas/notification.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Question, QuestionSchema } from 'src/user/schemas/question.schema';
import {
  QuestionTypeList,
  QuestionTypeListSchema,
} from 'src/user/schemas/question-type.schema';
import { UserService } from 'src/user/user.service';
import { ClientController } from './client.controller';

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
  controllers: [ClientController],
  providers: [UserService, MailService, CloudinaryService, NotificationService],
})
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyTokenMiddleware).forRoutes(
      {
        path: 'api/v1/client/logged-in',
        method: RequestMethod.GET,
      },
      { path: 'api/v1/client/change-password', method: RequestMethod.POST },
      { path: 'api/v1/client/delete-account', method: RequestMethod.POST },
      { path: 'api/v1/client/visibility', method: RequestMethod.PUT },
      { path: 'api/v1/client/edit-profile/:id', method: RequestMethod.PUT },
    );
  }
}

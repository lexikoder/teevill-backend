import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { MailService } from 'src/core/mail/email';

import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
  ],
  controllers: [AdminController],
  providers: [AdminService, MailService, CloudinaryService],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyTokenMiddleware).forRoutes({
      path: 'api/v1/admin/logged-in',
      method: RequestMethod.GET,
    });
  }
}

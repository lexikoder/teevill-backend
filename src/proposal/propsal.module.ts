import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { ProposalController } from './controllers/proposal.controller';
import { Proposal, ProposalSchema } from './schemas/proposal.schema';
import { ProposalService } from './services/proposal.service';
import { Job, JobSchema } from 'src/job/schemas/job.schema';
import { JobService } from 'src/job/services/job.service';
import { MailService } from 'src/core/mail/email';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  controllers: [ProposalController],
  providers: [ProposalService, JobService, MailService],
})
export class ProposalModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyTokenMiddleware).forRoutes(ProposalController);
  }
}

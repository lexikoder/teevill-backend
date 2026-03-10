import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import {
  WithdrawalApprovalStatus,
  WithdrawalMethod,
  WithdrawalStatus,
} from '../enum/withdrawal.enum';
import { JobDocument } from 'src/job/schemas/job.schema';

export type WithdrawalDocument = Withdrawal & Document;

@Schema({ timestamps: true })
export class Withdrawal {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, type: String })
  transactionId: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  freelancer: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Job', required: true })
  job: mongoose.Types.ObjectId | JobDocument;

  @Prop({
    enum: WithdrawalStatus,
    default: WithdrawalStatus.pending,
  })
  status: WithdrawalStatus;

  @Prop({
    enum: WithdrawalApprovalStatus,
    default: WithdrawalApprovalStatus.pending,
  })
  approvalStatus: WithdrawalApprovalStatus;

  @Prop({
    required: true,
    enum: WithdrawalMethod,
  })
  method: WithdrawalMethod;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
 
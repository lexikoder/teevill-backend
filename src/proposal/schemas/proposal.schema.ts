import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type ProposalDocument = Proposal & Document;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ required: true })
  timeLine: string;

  @Prop({ required: true })
  bidAmount: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Job', required: true })
  job: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  submittedBy: mongoose.Types.ObjectId;

  @Prop({
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected', 'under-review'],
  })
  status: string;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);

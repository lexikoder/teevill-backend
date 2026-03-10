import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { QuestionType } from '../enum/user.enum';

export type QuestionListDocument = QuestionTypeList & Document;

@Schema({ timestamps: true })
export class QuestionTypeList {
  @Prop({ type: String, enum: QuestionType })
  type: string;

  @Prop({ type: String })
  experience: string;

  @Prop({ type: String })
  skill: string;

  @Prop({ type: String })
  interest: string;

  @Prop({ type: String })
  paymentType: string;

  @Prop({ type: String })
  budget: string;

  @Prop({ type: String })
  workPreference: string;

  @Prop({ type: String })
  typeOfProject: string;

  @Prop({ type: String })
  agencyStaffNo: string;

  @Prop({ type: String })
  projectSize: string;

  @Prop({ type: String })
  hireType: string;

  @Prop({ type: String })
  clientProjectType: string;

  @Prop({ type: String })
  clientWorkPreference: string;

  @Prop({ type: String })
  clientBudget: string;

  @Prop({ type: String })
  clientJobType: string;

  @Prop({ type: String })
  numberOfStaff: string;

  @Prop({ type: String })
  sizeOfProject: string;

  @Prop({ type: String })
  jobType: string;
}

export const QuestionTypeListSchema =
  SchemaFactory.createForClass(QuestionTypeList);

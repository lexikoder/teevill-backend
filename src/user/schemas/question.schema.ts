import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export class PrimarySkill {
  @Prop({ type: { type: String }, default: null })
  skill: string;

  @Prop({ type: { type: String }, default: null })
  interest: string;

  @Prop({ type: { type: String }, default: null })
  paymentReference: string;
}

class Bio {
  @Prop({ type: { type: String }, default: null })
  title: string;

  @Prop({ type: { type: String }, default: null })
  bio: string;
}

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: String })
  previousExperience: string;

  @Prop({ type: String })
  primarySkills: string;

  @Prop({ type: String })
  interest: string;

  @Prop({ type: String })
  paymentType: string;

  @Prop({ type: String })
  hireType: string;

  @Prop({ type: String })
  projectSize: string;

  @Prop({ type: String })
  agencyStaffNo: string;

  @Prop({ type: String })
  budget: string;

  @Prop({ type: String })
  workPreference: string;

  @Prop({ type: String })
  typeOfProject: string;

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

  @Prop({ type: Bio })
  bio: Bio;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

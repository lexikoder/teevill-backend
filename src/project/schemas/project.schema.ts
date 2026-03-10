import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: true,
    type: String,
    enum: ['shared', 'personal', 'client'],
    default: null,
  })
  projectType: string;

  @Prop({ default: null })
  deadline: Date;

  @Prop({
    type: String,
    enum: ['pending', 'in-progress', 'review', 'completed'],
    default: 'in-progress',
  })
  status: 'in-progress' | 'review' | 'completed' | 'pending' | 'suspended';

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Section' }] })
  sections: mongoose.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'User' }] })
  usersAdded: mongoose.Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

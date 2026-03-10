import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type SectionDocument = Section & Document;

@Schema({ timestamps: true })
export class Section {
  @Prop({ required: true })
  title: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Project', required: true })
  project: mongoose.Types.ObjectId;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'User' }], default: [] })
  usersAdded: mongoose.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Task' }], default: [] })
  tasks: mongoose.Types.ObjectId[];
}

export const SectionSchema = SchemaFactory.createForClass(Section);

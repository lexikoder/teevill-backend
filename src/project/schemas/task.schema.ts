import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type SubTaskDocument = SubTask & Document;

@Schema({ timestamps: true })
export class SubTask {
  @Prop({ required: true })
  subTitle: string;

  @Prop({ default: false })
  status: boolean;
}

export const SubTaskSchema = SchemaFactory.createForClass(SubTask);

export type TaskDocument = Task & Document;
@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({
    type: {
      content: { type: String, default: null },
      image: [{ type: String, default: null }],
    },
    default: {},
  })
  description: { content: string; image: string[] };

  @Prop({
    type: String,
    enum: ['high', 'medium', 'low', 'casual'],
    default: 'casual',
  })
  priority: 'high' | 'medium' | 'low' | 'casual';

  @Prop({
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo',
  })
  status: 'todo' | 'in-progress' | 'completed';

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Section' })
  section: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  assignedTo: mongoose.Types.ObjectId[];

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Project', required: true })
  project: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'SubTask' }],
    required: false,
  })
  subTasks: mongoose.Types.ObjectId[];

  @Prop({ required: true })
  dueDate: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { accountType, ClientType } from '../enum/user.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ default: null })
  profileImage: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, default: false })
  isVerified: boolean;

  @Prop({ required: true, default: true })
  visible: boolean;

  @Prop({ type: String, enum: accountType, default: null })
  accountType: accountType;

  @Prop({ type: String, enum: ClientType, default: null })
  clientType: ClientType;

  @Prop({ required: false, default: null })
  verificationOtp: string;

  @Prop({ required: false, default: null })
  resetToken: string;

  @Prop({ default: null })
  resetTokenDate: Date;

  @Prop({ type: { type: mongoose.Types.ObjectId, ref: 'Question' } })
  question: mongoose.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

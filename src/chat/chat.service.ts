import { InjectModel } from '@nestjs/mongoose';
import { Chat } from './schemas/chat.schema';
import mongoose, { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async sendMessage(data: {
    sender: string;
    recipient: string;
    message: string;
    chatId: any;
  }) {
    const message = await this.messageModel.create({
      ...data,
      sender: new mongoose.Types.ObjectId(data.sender),
      recipient: new mongoose.Types.ObjectId(data.recipient),
      message: data.message,
      chat: new mongoose.Types.ObjectId(data.chatId),
    });

    return message;
  }

  async getMessages(chatId: string) {
    return await this.messageModel
      .find({ chatId })
      .populate({
        path: 'sender',
        model: 'User',
        select: 'firstName lastName email profileImage',
      })
      .populate({
        path: 'recipient',
        model: 'User',
        select: 'firstName lastName email profileImage',
      })
      .sort({ createdAt: -1 });
  }

  //create
  async createChat(sender: string, recipient: string): Promise<Chat> {
    const chat = await this.chatModel.create({
      sender: new mongoose.Types.ObjectId(sender),
      recipient: new mongoose.Types.ObjectId(recipient),
    });

    if (chat) return chat;
  }

  //find chat
  async findChat(senderId: string, recipientId: string) {
    const existingChat = await this.chatModel.findOne(
      {
        $or: [
          {
            sender: new mongoose.Types.ObjectId(senderId),
            recipient: new mongoose.Types.ObjectId(recipientId),
          },
          {
            sender: new mongoose.Types.ObjectId(recipientId),
            recipient: new mongoose.Types.ObjectId(senderId),
          },
        ],
      },
      {},
    );

    if (existingChat)
      return {
        _id: new mongoose.Types.ObjectId(existingChat._id),
        sender: existingChat.sender,
        recipient: existingChat.recipient,
      };
  }

  //find all chat
  async findAllChat(participantId: string) {
    const chat = await this.chatModel
      .find(
        {
          $or: [
            {
              sender: new mongoose.Types.ObjectId(participantId),
            },
          ],
        },
        {},
      )
      .populate({
        path: 'sender',
        model: 'User',
        select: 'firstName lastName email profileImage',
      })
      .populate({
        path: 'recipient',
        model: 'User',
        select: 'firstName lastName email profileImage',
      })
      .sort({ createdAt: -1 });

    if (chat) return chat;
  }
}

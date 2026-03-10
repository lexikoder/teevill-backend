import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/create-chat.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.connectedUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) this.connectedUsers.delete(userId);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('register')
  registerUser(client: Socket, userId: string) {
    this.connectedUsers.set(userId, client.id);
    console.log(`User registered: ${userId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, @MessageBody() payload: SendMessageDto) {
    const { sender, recipient, message } = payload;

    if (payload.sender || payload.recipient || payload.message)
      if (!sender || !recipient || !message) {
        return await this.server.emit(
          `${recipient}`,
          'sender, recipient, content are required',
        );
      }

    let chat;
    chat = await this.chatService.findChat(sender, recipient);
    if (!chat) {
      //create chat
      chat = await this.chatService.createChat(sender, recipient);
    }

    let chatId = chat._id;

    const sendMessage = await this.chatService.sendMessage({
      sender,
      recipient,
      message,
      chatId,
    });

    if (recipient)
      return await await this.server.emit(`${recipient}`, sendMessage);
  }

  @SubscribeMessage('getMessge')
  async hadnleGetMessage(client: Socket, chattId: string) {
    const chat = await this.chatService.getMessages(chattId);
    if (chattId) return await client.emit(`messageHistory`, chat);
  }

  @SubscribeMessage('chatsHistory')
  async handleChatHistory(client: Socket, participantId: string) {
    const chats = await this.chatService.findAllChat(participantId);
    if (!chats) return await client.emit('chat-history', []);
    return await client.emit('chat-history', chats);
  }
}

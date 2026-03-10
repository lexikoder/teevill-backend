import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/config/response';

@Controller('api/v1/chat')
@ApiTags('Freelancers and Clients Real-time Socket Description')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({
    summary: 'Send a message between freelancer and client (via WebSocket)',
    description: `
**Socket Operations**:

1. **Send Message**:
   - **Emit**: \`sendMessage\`
   - **Payload**:
     - \`sender\`: ID of the sender, may be client or freelancer
     - \`recipient\`: ID of the receiver, may be client or reciever
     - \`message\`: Text content/message of the chat
   - **Listen**: \`recipient id\` for real-time updates.

2. **Chat History with a user**:
   - **Emit**: \`getMessages\`
   - **Payload**:
     - \`chat Id\`: id of chat
   - **Listen**: \`messageHistory\` for historical chats.

3. **Chat Participation**:
   - **Emit**: \`getChats\`
   - **Payload**:
     - \`participantId\`: ID of the participant
   - **Listen**: \`chat-history\` for the list of participated chats.
`,
  })
  async sendMessage(
    @Body()
    payload: {
      sender: string;
      recipient: string;
      message: string;
    },
  ) {
    const { sender, recipient, message } = payload;
    const data = await this.chatService.createChat(sender, recipient);

    await this.chatService.sendMessage({
      sender,
      recipient,
      message,
      chatId: data,
    });

    return successResponse({
      message: `Chat created successfully`,
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }
}

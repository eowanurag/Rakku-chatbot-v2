import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() body: { message: string; sessionId: string; latitude?: number; longitude?: number; language?: string },
  ) {
    console.log('[ChatController.sendMessage] Entry - body:', JSON.stringify(body));
    const sessId = body.sessionId || 'default-session';
    try {
      const result = await this.chatService.sendMessage(body.message, sessId, body.latitude, body.longitude, body.language);
      console.log('[ChatController.sendMessage] Exit - Success');
      return result;
    } catch (error) {
      console.error('[ChatController.sendMessage] Error:', error);
      throw error;
    }
  }
}

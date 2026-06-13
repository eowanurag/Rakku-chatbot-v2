import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() body: { message: string; sessionId: string; latitude?: number; longitude?: number; language?: string },
  ) {
    const sessId = body.sessionId || 'default-session';
    return this.chatService.sendMessage(body.message, sessId, body.latitude, body.longitude, body.language);
  }
}

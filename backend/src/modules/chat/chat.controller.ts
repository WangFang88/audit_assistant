import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService, SendMessageDto } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations() {
    return this.chatService.listConversations();
  }

  @Get('conversations/:conversationId/messages')
  listMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.listMessages(conversationId);
  }

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }
}

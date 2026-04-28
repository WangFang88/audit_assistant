import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChatService, SendMessageDto } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async listConversations(@Query('groupId') groupId?: string) {
    return this.chatService.listConversations(groupId);
  }

  @Get('conversations/:conversationId/messages')
  async listMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.listMessages(conversationId);
  }

  @Post('messages')
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  @Post('direct-conversations')
  async findOrCreateDirectConversation(@Body('targetUserId') targetUserId: string) {
    return this.chatService.findOrCreateDirectConversation(targetUserId);
  }
}

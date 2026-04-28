import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Delete('conversations/:conversationId/messages')
  async clearMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.clearConversationMessages(conversationId);
  }

  @Get('conversations/:conversationId/messages/:messageId/file')
  async downloadMessageFile(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.chatService.downloadMessageFile(conversationId, messageId);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`);
    return result.buffer;
  }

  @Delete('conversations/:conversationId/messages/:messageId')
  async removeMessage(@Param('conversationId') conversationId: string, @Param('messageId') messageId: string) {
    return this.chatService.removeMessage(conversationId, messageId);
  }

  @Patch('conversations/:conversationId/messages/:messageId/recall')
  async recallMessage(@Param('conversationId') conversationId: string, @Param('messageId') messageId: string) {
    return this.chatService.recallMessage(conversationId, messageId);
  }

  @Delete('direct-conversations/:conversationId')
  async removeDirectConversation(@Param('conversationId') conversationId: string) {
    return this.chatService.removeDirectConversation(conversationId);
  }

  @Post('messages')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessage(@Body() dto: SendMessageDto, @UploadedFile() file?: Express.Multer.File) {
    return this.chatService.sendMessage(dto, file);
  }

  @Post('direct-conversations')
  async findOrCreateDirectConversation(@Body('targetUserId') targetUserId: string) {
    return this.chatService.findOrCreateDirectConversation(targetUserId);
  }
}

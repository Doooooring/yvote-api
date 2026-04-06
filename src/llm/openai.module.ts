import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { OpenAIController } from './openai.controller';
import { OpenAIService } from './openai.service';

@Module({
  controllers: [OpenAIController, ChatController],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}

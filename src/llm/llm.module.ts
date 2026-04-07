import { Module } from '@nestjs/common';
import { CommentModule } from 'src/comment/comment.module';
import { ChatController } from './chat.controller';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { SummarizeController } from './summarize.controller';

@Module({
  controllers: [LlmController, ChatController, SummarizeController],
  providers: [LlmService, SummarizeController],
  imports: [CommentModule],
  exports: [LlmService, SummarizeController],
})
export class LlmModule {}

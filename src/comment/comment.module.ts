import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/llm/openai.module';
import { OpenAIService } from 'src/llm/openai.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService, OpenAIService],
  imports: [RepositoryModule, OpenAIModule],
  exports: [],
})
export class CommentModule {}

import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/openai/openai.module';
import { OpenAIService } from 'src/openai/openai.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { CommentService } from './comment.service';

@Module({
  controllers: [Comment],
  providers: [CommentService, OpenAIService],
  imports: [RepositoryModule, OpenAIModule],
  exports: [],
})
export class CommentModule {}

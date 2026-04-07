import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/repository/repository.module';
import { CommentService } from './comment.service';

@Module({
  providers: [CommentService],
  imports: [RepositoryModule],
  exports: [CommentService],
})
export class CommentModule {}

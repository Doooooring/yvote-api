import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';
import { User } from 'src/entity/user.entity';
import { Vote } from 'src/entity/vote.entity';
import { KeywordRepository } from './keyword/keyword.repository';
import { NewsRepository } from './news/news.repository';
import { Timeline } from 'src/entity/timeline.entity';
import { CommentRepository } from './comment/comment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([News, Keyword, Comment, Timeline, User, Vote]),
  ],
  providers: [NewsRepository, KeywordRepository, CommentRepository],
  exports: [NewsRepository, KeywordRepository, CommentRepository],
})
export class RepositoryModule {}

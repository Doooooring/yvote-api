import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';
import { NewsSummary } from 'src/entity/newsSummary.entity';
import { ProposedAction } from 'src/entity/proposed-action.entity';
import { Timeline } from 'src/entity/timeline.entity';
import { User } from 'src/entity/user.entity';
import { Vote } from 'src/entity/vote.entity';
import { CommentRepository } from './comment/comment.repository';
import { KeywordRepository } from './keyword/keyword.repository';
import { NewsRepository } from './news/news.repository';
import { ProposedActionRepository } from './proposed-action/proposed-action.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      News,
      NewsSummary,
      Keyword,
      Comment,
      Timeline,
      User,
      Vote,
      ProposedAction,
    ]),
  ],
  providers: [
    NewsRepository,
    KeywordRepository,
    CommentRepository,
    ProposedActionRepository,
  ],
  exports: [
    NewsRepository,
    KeywordRepository,
    CommentRepository,
    ProposedActionRepository,
  ],
})
export class RepositoryModule {}

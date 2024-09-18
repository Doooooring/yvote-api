import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';
import { NewsKeyword } from 'src/entity/newsKeyword.emtity';
import { User } from 'src/entity/user.entity';
import { Vote } from 'src/entity/vote.entity';
import { KeywordRepository } from './keyword/keyword.repository';
import { NewsRepository } from './news/news.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([News, Keyword, NewsKeyword, Comment, User, Vote]),
  ],
  providers: [NewsRepository, KeywordRepository],
  exports: [NewsRepository, KeywordRepository],
})
export class RepositoryModule {}

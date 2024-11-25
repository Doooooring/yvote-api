import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { NewsCommentType } from 'src/interface/news';
import { Repository } from 'typeorm';

export interface RecentComment
  extends Pick<Comment, 'id' | 'commentType' | 'title' | 'comment' | 'date'> {
  newsId: number;
}

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async getCommentsRecentUpdated(offset: number, limit: number) {
    return (await this.commentRepo
      .createQueryBuilder('comment')
      .select([
        'comment.id',
        'comment.commentType',
        'comment.title',
        'comment.comment',
        'news.id AS newsId',
      ])
      .leftJoin('comment.news', 'news')
      .orderBy('comment.updatedAt')
      .offset(offset)
      .limit(limit)
      .getRawMany()) as RecentComment[];
  }

  async getCommentByNewsIdAndCommentType(
    id: number,
    type: NewsCommentType,
    offset: number,
    limit: number,
  ) {
    return await this.commentRepo.find({
      where: {
        news: {
          id: id,
        },
        comment: type,
      },
      order: {
        order: 'DESC',
      },
      skip: offset,
      take: limit,
    });
  }

  async getCommentAllByNewsIdAndCommentType(id: number) {
    return await this.commentRepo.find({
      where: {
        news: {
          id: id,
        },
      },
    });
  }
}

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
    return await this.commentRepo
      .createQueryBuilder('comment')
      .select([
        'comment.id',
        'comment.commentType',
        'comment.title',
        'comment.date',
        'comment.comment',
      ])
      .leftJoin('comment.news', 'news')
      .addSelect('news.id')
      .orderBy('comment.updatedAt', 'DESC')
      .offset(offset)
      .limit(limit)
      .getMany();
  }

  async getCommentByNewsIdAndCommentType(
    id: number,
    type: NewsCommentType,
    offset: number,
    limit: number,
  ) {
    return await this.commentRepo
      .createQueryBuilder('comment')
      .select([
        'comment.id',
        'comment.commentType',
        'comment.title',
        'comment.date',
        'comment.comment',
      ])
      .leftJoin('comment.news', 'news')
      .where('news.id = :id', { id: id })
      .andWhere('comment.commentType = :type', { type: type })
      .offset(offset)
      .limit(limit)
      .orderBy('comment.order', 'DESC')
      .getMany();
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

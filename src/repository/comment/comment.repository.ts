import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { NewsCommentType } from 'src/interface/news';
import { Repository } from 'typeorm';

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
        'comment.comment',
        'news.id AS news_id',
      ]) // Include only news.id
      .leftJoin('comment.news', 'news') // Use leftJoin if you don't need to select full news
      .orderBy('comment.updatedAt')
      .offset(offset)
      .limit(limit)
      .getRawMany();
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

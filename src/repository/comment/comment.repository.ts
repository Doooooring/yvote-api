import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { NewsCommentType } from 'src/interface/news';
import { DataSource, EntityManager, Repository } from 'typeorm';

export interface RecentComment
  extends Pick<Comment, 'id' | 'commentType' | 'title' | 'comment' | 'date'> {
  newsId: number;
}

@Injectable()
export class CommentRepository {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async startTransaction() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner;
  }

  async getCommentsRecentUpdated(offset: number, limit: number) {
    return await this.commentRepo
      .createQueryBuilder('comment')
      .select([
        'comment.id',
        'comment.commentType',
        'comment.title',
        'comment.date',
        'comment.url',
        'comment.comment',
      ])
      .leftJoin('comment.news', 'news')
      .addSelect('news.id')
      .where('comment.date IS NOT NULL')
      .andWhere('news.isPublished  = :published', { published: true })
      .andWhere('news.state = :state', { state: false })
      .orderBy('comment.date', 'DESC')
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
        'comment.url',
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

  async saveCommentsByNewsId(
    newsId: number,
    commentType: NewsCommentType,
    comments: Comment[],
  ) {
    const queryRunner = await this.startTransaction();
    try {
      const commentRepo = queryRunner.manager.getRepository(Comment);

      const ids = [];

      for (const order in comments) {
        const comment = comments[order];
        comment.order = comments.length - Number(order);
        const result = await this.saveCommentByNewsId(newsId, comment);
        ids.push(result.id);
      }

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Comment)
        .where('commentType = :commentType', { commentType })
        .andWhere('newsId = :newsId', { newsId: newsId })
        .andWhere('id NOT IN (:...ids)', { ids })
        .execute();

      await queryRunner.commitTransaction();
      return true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw Error(e);
    } finally {
      await queryRunner.release();
    }
  }

  async saveCommentByNewsId(
    newsId: number,
    comment: Comment,
    manager?: EntityManager,
  ) {
    const commentRepo = manager
      ? manager.getRepository(Comment)
      : this.commentRepo;

    const response = await commentRepo.save({
      ...comment,
      news: { id: newsId },
    });

    return response;
  }

  async hydrateCommentsByCommentTypes(
    newsId: number,
    commentTypes: Array<NewsCommentType>,
  ) {
    const queryBuilder = this.commentRepo
      .createQueryBuilder('comment')
      .delete()
      .where('newsId = :newsId', { newsId });

    if (commentTypes.length > 0) {
      queryBuilder.andWhere('commentType NOT IN (:...commentTypes)', {
        commentTypes,
      });
    }

    const response = await queryBuilder.execute();
  }
}

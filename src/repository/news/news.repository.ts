import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';
import { Vote } from 'src/entity/vote.entity';
import { NewsPreviews } from 'src/interface/news';
import { FindOptionsWhere, In, Repository } from 'typeorm';

@Injectable()
export class NewsRepository {
  constructor(
    @InjectRepository(News)
    private readonly newsRepo: Repository<News>,
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async getNewsIds() {
    return this.newsRepo.find({
      select: ['id'],
    });
  }

  async getNewsCount() {
    return this.newsRepo.count();
  }

  async getOrderMaximum() {
    return this.newsRepo.find({
      order: {
        order: 'ASC',
      },
      select: ['order'],
      take: 1,
    });
  }

  getNewsPreviews(page: number, limit: number) {
    return this.newsRepo
      .createQueryBuilder('news')
      .select([
        'id',
        'order',
        'title',
        'SUBSTR(summary, 0, 100) AS summary',
        'state',
        'isPublished',
        'timeline',
      ])
      .leftJoinAndSelect('news.keyword', 'keyword')
      .addSelect('keyword.keyword', 'keywords')
      .orderBy('order')
      .limit(limit)
      .skip(page);
  }

  async getNewsPreviewsWithKeyword(
    page: number,
    limit: number,
    keyword: string,
  ) {
    return this.getNewsPreviews(page, limit)
      .leftJoin('news.keywords', 'keyword')
      .where('keyword.keyword = :keyword', { keyword })
      .getRawMany() as Promise<NewsPreviews[]>;
  }

  async getNewsPreviewsAdmin(page: number, limit: number) {
    return this.getNewsPreviews(page, limit)
      .where('isPublished = True')
      .getMany() as Promise<NewsPreviews[]>;
  }

  async getNewsListByOptions(options: FindOptionsWhere<News> = {}) {
    return this.newsRepo.find({
      where: options,
    });
  }

  async getNewsByIdList(ids: number[], options: FindOptionsWhere<News> = {}) {
    const whereOption: FindOptionsWhere<News> = { id: In(ids), ...options };
    return this.getNewsListByOptions(whereOption);
  }

  async getNewsByOptions(options: FindOptionsWhere<News> = {}) {
    return this.newsRepo.findOne({
      where: options,
    });
  }

  async getNewsById(id: number) {
    return this.getNewsByOptions({ id });
  }
}

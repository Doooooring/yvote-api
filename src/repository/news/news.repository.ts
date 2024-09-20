import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';
import { Vote } from 'src/entity/vote.entity';
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

  async getNewsPreviews(page: number, limit: number) {
    return this.newsRepo
      .createQueryBuilder('get-previews')
      .select([
        'id',
        'order',
        'title',
        'SUBSTR(summary, 0, 100) AS summary',
        'state',
        'isPublished',
        'timeline',
      ])
      .orderBy('order')
      .limit(limit)
      .skip(page)
      .getRawMany();
  }

  async getNewsPreviewsByKeyword(
    keyword: string,
    page: number,
    limit: number,
  ) {}

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

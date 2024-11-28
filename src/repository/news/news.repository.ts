import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';
import { Vote } from 'src/entity/vote.entity';
import { NewsEdit, NewsinView, NewsPreviews } from 'src/interface/news';
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
      select: ['id'],
      take: 1,
    });
  }

  async getNewsRecent() {}

  async getNewsInView(id: number) {
    return this.newsRepo
      .createQueryBuilder('news')
      .select([
        'id',
        'title',
        'summary',
        'state',
        'opinionLeft',
        'opinionRight',
        'isPublished',
      ])
      .leftJoinAndSelect('newsImage', 'img')
      .leftJoin('news.keywords', 'keywords')
      .addSelect(['keywords.keyword', 'keywords.id'])
      .leftJoin('news.comments', 'comment')
      .addSelect('DISTINCT(comment.commentType)', 'comments')
      .leftJoinAndSelect('news.timeline', 'timeline')
      .orderBy('timeline.date', 'ASC')
      .where('news.id = :id', { id: id })
      .getRawOne() as Promise<NewsinView>;
  }

  async getNewsInEdit(id: number) {
    return this.newsRepo
      .createQueryBuilder('news')
      .select([
        'id',
        'title',
        'summary',
        'state',
        'opinionLeft',
        'opinionRight',
      ])
      .leftJoinAndSelect('newsImage', 'img')
      .leftJoinAndSelect('news.keyword', 'keyword')
      .leftJoinAndSelect('news.comments', 'comments')
      .leftJoinAndSelect('news.timeline', 'timeline')
      .where('news.id = :id', { id: id })
      .orderBy('timeline.date', 'ASC')
      .getRawOne() as Promise<News>;
  }

  getNewsPreviewsProto(page: number, limit: number) {
    return this.newsRepo
      .createQueryBuilder('news')
      .select([
        'id',
        'title',
        'SUBSTR(summary, 0, 100) AS summary',
        'newsImage',
        'state',
        'isPublished',
      ])
      .leftJoinAndSelect('newsImage', 'img')
      .leftJoinAndSelect('news.keyword', 'keyword')
      .leftJoinAndSelect('news.timeline', 'timeline')
      .addSelect('keyword.keyword', 'keywords')
      .orderBy('state', 'DESC')
      .addOrderBy(
        '(SELECT MAX(t.date) FROM timeline t WHERE t.newsId = news.id)',
        'DESC',
      )
      .addOrderBy('id', 'DESC')
      .limit(limit)
      .skip(page);
  }

  async getNewsPreviews(page: number, limit: number, keyword?: string) {
    const q = this.getNewsPreviewsProto(page, limit);
    if (keyword) {
      q.where('keyword.keyword = :keyword', { keyword });
    }
    return q.getRawMany() as Promise<NewsPreviews[]>;
  }

  async getNewsPreviewsAdmin(page: number, limit: number, keyword?: string) {
    const q = this.getNewsPreviewsProto(page, limit).andWhere(
      'isPublished = True',
    );
    if (keyword) {
      q.where('keyword.keyword = :keyword', { keyword });
    }

    return q.getRawMany() as Promise<NewsPreviews[]>;
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

  async postNews(news: NewsEdit) {
    return this.newsRepo.save(news);
  }

  async updateNews(id: number, news: Partial<NewsEdit>) {
    return this.newsRepo.update({ id: id }, news);
  }
}

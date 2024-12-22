import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { News } from 'src/entity/news.entity';
import { NewsEdit, NewsPreviews } from 'src/interface/news';
import { mergeUniqueArrays } from 'src/tools/common';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  Like,
  Repository,
} from 'typeorm';
import { KeywordRepository } from '../keyword/keyword.repository';

@Injectable()
export class NewsRepository {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(News)
    private readonly newsRepo: Repository<News>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly keywordRepository: KeywordRepository,
  ) {}

  async startTransaction() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner;
  }
  async getNewsIds() {
    return this.newsRepo.find({
      select: ['id'],
    });
  }

  async getNewsTitles(search: string) {
    return this.newsRepo.find({
      select: ['id', 'title'],
      where: {
        title: Like(`%${search}%`),
      },
    }) as Promise<Pick<News, 'id' | 'title'>[]>;
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
    const news = await this.newsRepo
      .createQueryBuilder('news')
      .select([
        'news.id',
        'news.title',
        'news.summary',
        'news.state',
        'news.opinionLeft',
        'news.opinionRight',
        'news.isPublished',
        'news.newsImage',
      ])
      .leftJoin('news.keywords', 'keywords')
      .addSelect(['keywords.keyword', 'keywords.id'])
      .leftJoinAndSelect('news.timeline', 'timeline')
      .orderBy('timeline.date', 'ASC')
      .where('news.id = :id', { id: id })
      .getOne();

    const distnctComments = await this.commentRepo
      .createQueryBuilder('c')
      .select('DISTINCT c.commentType', 'commentType')
      .where('c.newsId = :id', { id })
      .getRawMany();

    news.comments = distnctComments.map(({ commentType }) => commentType);

    return news;
  }

  async getNewsInEdit(id: number) {
    return this.newsRepo
      .createQueryBuilder('news')
      .select([
        'news.id',
        'news.title',
        'news.summary',
        'news.state',
        'news.opinionLeft',
        'news.opinionRight',
        'news.newsImage',
      ])
      .leftJoinAndSelect('news.keywords', 'keyword')
      .leftJoinAndSelect('news.comments', 'comments')
      .leftJoinAndSelect('news.timeline', 'timeline')
      .where('news.id = :id', { id: id })
      .orderBy('timeline.date', 'ASC')
      .getOne() as Promise<News>;
  }

  getNewsPreviewsProto(page: number, limit: number) {
    return this.newsRepo
      .createQueryBuilder('news')
      .select(['id', 'title', 'summary', 'newsImage', 'state', 'isPublished'])
      .leftJoinAndSelect('newsImage', 'img')
      .leftJoin('news.keywords', 'keywords')
      .leftJoin('news.timeline', 'timeline')
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
      q.where('keywords.keyword = :keyword', { keyword });
    }
    return q.getRawMany() as Promise<NewsPreviews[]>;
  }

  async getNewsPreviewsAdmin(page: number, limit: number, keyword?: string) {
    const q = this.getNewsPreviewsProto(page, limit).andWhere(
      'isPublished = True',
    );
    if (keyword) {
      q.where('keywords.keyword = :keyword', { keyword });
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

  async postNews(news: NewsEdit) {
    const queryRunner = await this.startTransaction();

    try {
      const newsRepository = queryRunner.manager.getRepository(News);
      await newsRepository.save({
        ...news,
        order: 0,
      });

      if (news.state) {
        const keywords = news.keywords;
        await this.updateKeywordsState(
          keywords.map(({ id }) => id),
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();
    } catch (e) {
      console.log(e);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async updateNews(id: number, news: Partial<NewsEdit>) {
    const queryRunner = await this.startTransaction();

    try {
      const prevNews = await this.newsRepo.findOne({ where: { id } });
      const prevKeywords = prevNews.keywords.map(({ id }) => id);
      const curKeywords = news.keywords.map(({ id }) => id) ?? [];

      const newsRepository = queryRunner.manager.getRepository(News);
      await newsRepository.save({
        ...news,
      });

      const keywordsToUpdate = mergeUniqueArrays(prevKeywords, curKeywords);
      await this.updateKeywordsState(keywordsToUpdate, queryRunner.manager);
    } catch (e) {
      console.log(e);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteNewsById(id: number) {
    const queryRunner = await this.startTransaction();

    try {
      const prevNews = await this.newsRepo.findOne({ where: { id } });
      const prevKeywords = prevNews.keywords.map(({ id }) => id);
      const newsRepository = queryRunner.manager.getRepository(News);
      await newsRepository.delete({
        id: id,
      });
      await this.updateKeywordsState(prevKeywords, queryRunner.manager);
    } catch (e) {
      console.log(e);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async updateKeywordsState(keywords: number[], manager: EntityManager) {
    for (const id of keywords) {
      await this.keywordRepository.updateKeywordState(id, manager);
    }
  }
}

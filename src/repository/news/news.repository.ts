import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { News } from 'src/entity/news.entity';
import { DBERROR } from 'src/interface/err';
import { NewsEdit } from 'src/interface/news';
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

  async getNewsInView(id: number) {
    const news = await this.newsRepo
      .createQueryBuilder('news')
      .select([
        'news.id',
        'news.title',
        'news.subTitle',
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

    if (!news) throw Error(DBERROR.NOT_EXIST);
    const distnctComments = await this.getDistinctCommentTypeByNewsId(id);

    news.comments = distnctComments.map(({ commentType }) => commentType);

    return news;
  }

  async getNewsInEdit(id: number) {
    return this.newsRepo
      .createQueryBuilder('news')
      .select([
        'news.id',
        'news.title',
        'news.subTitle',
        'news.summary',
        'news.state',
        'news.isPublished',
        'news.opinionLeft',
        'news.opinionRight',
        'news.newsImage',
        'keyword.id',
        'keyword.keyword',
      ])
      .leftJoin('news.keywords', 'keyword')
      .leftJoinAndSelect('news.comments', 'comments')
      .leftJoinAndSelect('news.timeline', 'timeline')
      .where('news.id = :id', { id: id })
      .addOrderBy('timeline.date', 'ASC')
      .addOrderBy('comments.order', 'ASC')
      .getOne() as Promise<News>;
  }

  getNewsPreviews(
    page: number,
    limit: number,
    {
      keyword,
      isAdmin,
    }: {
      keyword?: string;
      isAdmin?: boolean;
    },
  ) {
    const subQuery = this.newsRepo
      .createQueryBuilder('subNews')
      .select('subNews.id id')
      .leftJoin('subNews.timeline', 'timeline')
      .addOrderBy(
        '(SELECT MAX(t.date) FROM timeline t WHERE t.newsId = subNew.id)',
        'DESC',
      )
      .groupBy('subNews.id')
      .where('1 = 1');

    if (!isAdmin) subQuery.andWhere('isPublished = True');
    if (keyword) {
      subQuery
        .leftJoin('subNews.keywords', 'keywords')
        .andWhere('keywords.keyword = :keyword', { keyword });
    }
    subQuery
      .orderBy('state', 'DESC')
      .addOrderBy('subNews.id', 'DESC')
      .limit(limit)
      .offset(page);

    return this.newsRepo
      .createQueryBuilder('news')
      .innerJoin(
        `(${subQuery.getQuery()})`,
        'paged_news',
        'news.id = paged_news.id',
      )
      .setParameters(subQuery.getParameters())
      .select([
        'news.id',
        'news.title',
        'news.subTitle',
        'news.summary',
        'news.newsImage',
        'news.state',
        'news.isPublished',
        'keywords.keyword',
      ])
      .leftJoin('news.keywords', 'keywords')
      .getMany();
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
    const newsRepository = queryRunner.manager.getRepository(News);

    try {
      const prevNews = await this.getNewsInView(id);

      const prevKeywords = prevNews.keywords.map(({ id }) => id);
      const curKeywords = news.keywords.map(({ id }) => id) ?? [];

      await newsRepository.save(news);

      const keywordsToUpdate = mergeUniqueArrays(prevKeywords, curKeywords);
      await this.updateKeywordsState(keywordsToUpdate, queryRunner.manager);
      await queryRunner.commitTransaction();
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
      const prevNews = await this.getNewsInView(id);
      const prevKeywords = prevNews.keywords.map(({ id }) => id);
      const newsRepository = queryRunner.manager.getRepository(News);
      await newsRepository.delete({
        id: id,
      });
      await this.updateKeywordsState(prevKeywords, queryRunner.manager);
      await queryRunner.commitTransaction();
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

  async getDistinctCommentTypeByNewsId(id: number) {
    return await this.commentRepo
      .createQueryBuilder('c')
      .select('DISTINCT c.commentType', 'commentType')
      .where('c.newsId = :id', { id })
      .getRawMany();
  }
}

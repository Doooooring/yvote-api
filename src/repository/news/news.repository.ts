import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { News } from 'src/entity/news.entity';
import { NewsSummary } from 'src/entity/newsSummary.entity';
import { DBERROR } from 'src/interface/err';
import { NewsCommentType, NewsEdit, NewsState } from 'src/interface/news';
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
    @InjectRepository(NewsSummary)
    private readonly newsSummaryRepo: Repository<NewsSummary>,
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
      select: ['id', 'title', 'subTitle'],
      where: [
        { title: Like(`%${search}%`) },
        { subTitle: Like(`%${search}%`) },
      ],
    }) as Promise<Pick<News, 'id' | 'title' | 'subTitle'>[]>;
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
        'news.date',
        'news.state',
        'news.opinionLeft',
        'news.opinionRight',
        'news.isPublished',
        'news.newsImage',
      ])
      .leftJoin('news.keywords', 'keywords')
      .addSelect(['keywords.keyword', 'keywords.id'])
      .leftJoinAndSelect('news.summaries', 'summaries')
      .leftJoinAndSelect('news.timeline', 'timeline')
      .orderBy('timeline.order', 'ASC')
      .where('news.id = :id', { id: id })
      .getOne();

    console.log(news);

    if (!news) throw Error(DBERROR.NOT_EXIST);
    const distnctComments = await this.getDistinctCommentTypeByNewsId(id);

    news.comments = distnctComments.map(({ commentType }) => commentType);

    return news;
  }

  async getNewsInEdit(id: number) {
    const news = await this.newsRepo
      .createQueryBuilder('news')
      .select([
        'news.id',
        'news.title',
        'news.subTitle',
        'news.summary',
        'news.date',
        'news.state',
        'news.isPublished',
        'news.opinionLeft',
        'news.opinionRight',
        'news.newsImage',
        'keyword.id',
        'keyword.keyword',
      ])
      .leftJoin('news.keywords', 'keyword')
      .leftJoinAndSelect('news.timeline', 'timeline')
      .leftJoinAndSelect('news.summaries', 'summaries')
      .orderBy('timeline.order', 'ASC')
      .where('news.id = :id', { id: id })
      .getOne();

    // const distnctComments = await this.getDistinctCommentTypeByNewsId(id);

    // news.comments = distnctComments.map(({ commentType }) => commentType);
    return news;
  }

  async getNewsPreviews(
    page: number,
    limit: number,
    {
      keyword,
      state,
    }: {
      keyword?: string;
      state?: NewsState;
    },
  ) {
    const subQuery = this.newsRepo
      .createQueryBuilder('subNews')
      .select(['subNews.id id'])
      .groupBy('subNews.id')
      .where('1 = 1');

    if (state)
      subQuery.andWhere('state  = :state', {
        state: state,
      });

    if (keyword) {
      subQuery
        .leftJoin('subNews.keywords', 'keywords')
        .andWhere('keywords.keyword = :keyword', { keyword });
    }
    subQuery
      .orderBy('state', 'DESC')
      .addOrderBy('subNews.date', 'DESC')
      .addOrderBy('subNews.id', 'DESC')
      .limit(limit)
      .offset(page);

    const response = await this.newsRepo
      .createQueryBuilder('news')
      .innerJoin(
        `(${subQuery.getQuery()})`,
        'paged_news',
        'news.id = paged_news.id',
      )
      .setParameters(subQuery.getParameters())
      .select([
        'news.id id',
        'news.title title',
        'news.subTitle subTitle',
        'news.newsImage newsImage',
        'news.state state',
        'news.isPublished isPublished',
        'news.date date',
        'keywords.id keywordId',
        'keywords.keyword keyword',
      ])
      .leftJoin('news.keywords', 'keywords')
      .getRawMany();

    if (response.length === 0) return [];

    const ids = [];
    const entityMap = {};
    response.forEach((row) => {
      const { id, keywordId, keyword, ...rest } = row;
      if (id in entityMap) {
        entityMap[id].keywords.push({ id: keywordId, keyword });
      } else {
        ids.push(id);
        entityMap[id] = {
          id: Number(id),
          ...rest,
          keywords: [{ id: Number(keywordId), keyword }],
        };
      }
    });

    const summaries = await this.newsSummaryRepo
      .createQueryBuilder('newsSummary')
      .select([
        'newsSummary.newsId newsId',
        'newsSummary.commentType commentType',
        'newsSummary.summary summary',
      ])
      .where('newsSummary.newsId IN (:...ids)', { ids })
      .getRawMany();

    summaries.forEach((row) => {
      const { newsId, commentType } = row;
      if (newsId in entityMap) {
        const entity = entityMap[newsId];
        if (!entity.comments) {
          entity.comments = [];
        }
        entity.comments.push(commentType);
        if (commentType === NewsCommentType.와이보트) {
          entity.summary = row.summary;
        }
      }
    });

    const result = ids.map((id) => {
      return entityMap[id];
    });

    return result;
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
      const result = await newsRepository.save({
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
      return result.id;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw Error(e);
    } finally {
      await queryRunner.release();
    }
  }

  async createNewsSummary(newsId: number, commentType: NewsCommentType) {
    const queryRunner = await this.startTransaction();
    const newsSummaryRepo = queryRunner.manager.getRepository(NewsSummary);

    console.log('============');
    console.log(newsId, commentType);

    try {
      const existingSummary = await newsSummaryRepo.findOne({
        where: {
          news: { id: newsId },
          commentType: commentType,
        },
      });

      console.log(existingSummary);
      if (existingSummary) {
        console.log('Duplicate summary found');
        throw Error(DBERROR.DUPLICATE);
      }

      const newsSummary = {
        news: {
          id: newsId,
        },
        summary: '',
        commentType: commentType,
      };

      await newsSummaryRepo.save(newsSummary);
      await queryRunner.commitTransaction();
      return newsSummary;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.log(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async convertNewsCommentType(
    newsId: number,
    prev: NewsCommentType,
    next: NewsCommentType,
  ) {
    const queryRunner = await this.startTransaction();

    try {
      await queryRunner.manager
        .createQueryBuilder()
        .update(NewsSummary)
        .set({ commentType: next })
        .where('newsId = :newsId AND commentType = :prev', { newsId, prev })
        .execute();

      await queryRunner.manager
        .createQueryBuilder()
        .update(Comment)
        .set({ commentType: next })
        .where('newsId = :newsId AND commentType = :prev', { newsId, prev })
        .execute();
      await queryRunner.commitTransaction();

      return true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    }
  }

  async deleteNewsComment(newsId: number, commentType: NewsCommentType) {
    const queryRunner = await this.startTransaction();

    try {
      const newsSummaryRepo = queryRunner.manager.getRepository(NewsSummary);
      const commentRepo = queryRunner.manager.getRepository(Comment);

      await newsSummaryRepo.delete({
        news: { id: newsId },
        commentType: commentType,
      });

      await commentRepo.delete({
        news: { id: newsId },
        commentType: commentType,
      });

      await queryRunner.commitTransaction();
      return true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
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
      await queryRunner.rollbackTransaction();
      throw e;
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
      await queryRunner.rollbackTransaction();
      throw e;
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

  async hydrateNewsSummariesByCommentTypes(
    newsId: number,
    commentTypes: NewsCommentType[],
  ) {
    const queryBuilder = this.newsSummaryRepo
      .createQueryBuilder('newsSummary')
      .delete()
      .where('newsId = :id', { id: newsId });

    if (commentTypes.length > 0) {
      queryBuilder.andWhere('commentType NOT IN (:...commentTypes)', {
        commentTypes,
      });
    }
    return await queryBuilder.execute();
  }
}

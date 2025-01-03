import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Keyword } from 'src/entity/keyword.entity';
import { KeywordEdit, keywordCategory } from 'src/interface/keyword';
import {
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
export interface KeywordWithImg extends Omit<Keyword, 'news'> {
  img: string;
}

@Injectable()
export class KeywordRepository {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
  ) {}

  async startTransaction() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner;
  }

  async getKeywordsKey(offset: number, limit: number, search: string) {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .select(['id', 'keyword'])
      .where('keyword.keyword LIKE :like', { like: `%${search}%` })
      .offset(offset)
      .limit(limit)
      .getMany() as Promise<Array<Pick<Keyword, 'id' | 'keyword'>>>;
  }

  async getKeywordsKeyByNewsId(id: number) {
    return this.getKeywordsByNewsId(id, ['id', 'keyword']) as Promise<
      Array<Pick<Keyword, 'id' | 'keyword'>>
    >;
  }

  async getRecentKeywords() {
    return this.keywordRepo.find({
      where: {
        recent: true,
      },
      order: {
        keyword: 'ASC',
      },
    });
  }

  getKeywordsShortProto(limit: number, offset: number) {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .select([
        'keyword.id',
        'keyword.keyword',
        'keyword.category',
        'keyword.keywordImage',
      ])
      .limit(limit)
      .offset(offset)
      .orderBy('keyword.keyword', 'ASC');
  }

  getKeywordsShortByCategory(
    qb: SelectQueryBuilder<Keyword>,
    category: keywordCategory,
  ) {
    return qb.andWhere('keyword.category = :category', { category: category });
  }

  getKeywordsShortBySearch(qb: SelectQueryBuilder<Keyword>, search: string) {
    return qb.andWhere('keyword.keyword REGEXP :regex', {
      regex: `%${search}%`,
    });
  }

  getRecentKeywordsShort(qb: SelectQueryBuilder<Keyword>) {
    return qb
      .innerJoin('keyword.news', 'news')
      .where('news.state = :state', { state: true })
      .distinct(true);
  }

  getKeywordProto() {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .select([
        'keyword.id',
        'keyword.keyword',
        'keyword.explain',
        'keyword.category',
        'keyword.recent',
        'keyword.keywordImage',
      ]);
  }

  async getKeywordById(id: number) {
    return this.getKeywordProto()
      .where('keyword.id = :id', { id: id })
      .getOne();
  }

  async getKeywordByKey(key: string) {
    return this.getKeywordProto()
      .where('keyword.keyword = :keyword', { keyword: key })
      .getOne();
  }

  async getKeywordByIdWithNews(id: number) {
    return this.getKeywordProto()
      .where('keyword.id = :id', { id: id })
      .leftJoin('keyword.news', 'news')
      .addSelect('news.title')
      .getOne();
  }

  async getKeywordByKeyWithNews(key: string) {
    return this.getKeywordProto()
      .leftJoin('keyword.news', 'news')
      .addSelect('news.title')
      .where('keyword.keyword = :keyword', { keyword: key })
      .getOne();
  }

  async postKeyword(obj: KeywordEdit) {
    const queryRunner = await this.startTransaction();

    try {
      const keywordRepository = queryRunner.manager.getRepository(Keyword);
      const keyword = await keywordRepository.save(obj);

      const id = keyword.id;
      await this.updateKeywordState(id, queryRunner.manager);
      await queryRunner.commitTransaction();
    } catch (e) {
      console.log('<<<<<<<<<<<<<<<<<<<');
      console.log(e);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async updateKeyword(id: number, obj: KeywordEdit) {
    const queryRunner = await this.startTransaction();

    try {
      const keywordRepository = queryRunner.manager.getRepository(Keyword);
      await keywordRepository.update(obj, { id: id });

      await this.updateKeywordState(id, queryRunner.manager);
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteKeyword(id: number) {
    const queryRunner = await this.startTransaction();
    try {
      const keywordRepository = queryRunner.manager.getRepository(Keyword);
      await keywordRepository.delete({ id });

      await this.updateKeywordState(id, queryRunner.manager);
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    return this.keywordRepo.delete({ id: id });
  }

  async updateKeywordState(id: number, manager: EntityManager) {
    const state = await this.getKeywordState(id, manager);
    const response = await manager
      .createQueryBuilder()
      .update('Keyword')
      .set({
        recent: state,
      })
      .where({ id: id })
      .execute();
    return response;
  }

  async getKeywordState(keywordId: number, manager?: EntityManager) {
    let keywordRepo;
    if (manager) {
      keywordRepo = manager.getRepository(Keyword);
    } else {
      keywordRepo = this.keywordRepo;
    }

    const cnt = await keywordRepo
      .createQueryBuilder('keyword')
      .leftJoinAndSelect('keyword.news', 'news')
      .where('keyword.id = :keywordId', { keywordId })
      .andWhere('news.state = :state', { state: true })
      .getCount();

    return cnt > 0;
  }

  async getKeywordsByNewsId(id: number, fields: string[]) {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .select(fields)
      .leftJoinAndSelect('keyword.news', 'news')
      .where('news.id = :news_id', { news_id: id })
      .getMany();
  }
}

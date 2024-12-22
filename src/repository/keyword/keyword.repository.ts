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
      .where('keyword.keyword REGEXP :regex', {
        regex: `%${search}%`,
      })
      .limit(limit)
      .offset(offset)
      .getRawMany() as Promise<Array<Pick<Keyword, 'id' | 'keyword'>>>;
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
      .select(['id', 'keyword', 'category', 'keywordImage'])
      .limit(limit)
      .offset(offset)
      .orderBy('keyword', 'ASC');
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
        'id',
        'keyword',
        'explain',
        'category',
        'recent',
        'keywordImage',
      ]);
  }

  async getKeywordById(id: number) {
    return this.getKeywordProto()
      .where('keyword.id = :id', { id: id })
      .getRawOne() as Promise<KeywordWithImg>;
  }

  async getKeywordByKey(key: string) {
    return this.getKeywordProto()
      .where('keyword.keyword = :keyword', { keyword: key })
      .getRawOne() as Promise<KeywordWithImg>;
  }

  async postKeyword(obj: KeywordEdit) {
    const queryRunner = await this.startTransaction();

    try {
      const keywordRepository = queryRunner.manager.getRepository(Keyword);
      const keyword = await keywordRepository.save(obj);

      const id = keyword.id;
      await this.updateKeywordState(id, queryRunner.manager);
    } catch (e) {
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
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    return this.keywordRepo.delete({ id: id });
  }

  async updateKeywordState(id: number, manager: EntityManager) {
    const state = await this.getKeywordState(id);
    await manager
      .createQueryBuilder()
      .update('Keyword')
      .set({
        state: state,
      })
      .where({ id: id })
      .execute();
  }

  async getKeywordState(keywordId: number) {
    const cnt = await this.keywordRepo
      .createQueryBuilder('keyword')
      .leftJoinAndSelect('keyword.news', 'news')
      .where('keyword.id = :keywordId', { keywordId })
      .andWhere('news.status = :status', { status: true })
      .getCount();
    return cnt > 0;
  }

  async getKeywordsByNewsId(id: number, fields: string[]) {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .select(fields)
      .leftJoinAndSelect('keyword.news', 'news')
      .where('news.id = :news_id', { news_id: id })
      .getRawMany();
  }
}

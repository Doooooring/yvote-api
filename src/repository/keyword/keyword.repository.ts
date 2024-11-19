import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Keyword } from 'src/entity/keyword.entity';
import { KeywordEdit, keywordCategory } from 'src/interface/keyword';
import { Repository, SelectQueryBuilder } from 'typeorm';
export interface KeywordWithImg extends Omit<Keyword, 'news'> {
  img: string;
}

@Injectable()
export class KeywordRepository {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
  ) {}

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
    return qb.andWhere('keyword.recent :is', {
      is: true,
    });
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
    return this.keywordRepo.save(obj);
  }

  async updateKeyword(id: number, obj: KeywordEdit) {
    return this.keywordRepo.update({ id: id }, obj);
  }

  async deleteKeyword(id: number) {
    return this.keywordRepo.delete({ id: id });
  }

  // async getKeywordsByNewsId(id: number, fields: string[]) {
  //   return this.keywordRepo
  //     .createQueryBuilder('keyword')
  //     .select(fields)
  //     .where((qb) => {
  //       const subQuery = qb
  //         .subQuery()
  //         .select('newsKeyword.keywords')
  //         .from(NewsKeyword, 'newsKeyword')
  //         .where('newsKeyword.news_id = :id', { id: id });

  //       return 'keyword.keyword IN' + subQuery;
  //     })
  //     .getRawMany();
  // }

  async getKeywordsByNewsId(id: number, fields: string[]) {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .select(fields)
      .leftJoinAndSelect('keyword.news', 'news')
      .where('news.id = :news_id', { news_id: id })
      .getRawMany();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Keyword } from 'src/entity/keyword.entity';
import { Repository } from 'typeorm';

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

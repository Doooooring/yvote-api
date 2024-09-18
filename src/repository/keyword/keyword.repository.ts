import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Keyword } from 'src/entity/keyword.entity';
import { NewsKeyword } from 'src/entity/newsKeyword.emtity';
import { Repository } from 'typeorm';

@Injectable()
export class KeywordRepository {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @InjectRepository(NewsKeyword)
    private readonly newsKeywordRepo: Repository<NewsKeyword>,
  ) {}

  async getKeywordsKeyByNewsId(id: number) {
    return this.getKeywordsByNewsId(id, ['id', 'keyword']) as Promise<
      Array<Pick<Keyword, 'id' | 'keyword'>>
    >;
  }

  async getKeywordsByNewsId(id: number, fields: string[]) {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .select(fields)
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('newsKeyword.keywords')
          .from(NewsKeyword, 'newsKeyword')
          .where('newsKeyword.news_id = :id', { id: id });

        return 'keyword.keyword IN' + subQuery;
      })
      .getRawMany();
  }
}

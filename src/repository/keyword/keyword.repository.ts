import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Keyword } from 'src/entity/keyword.entity';
import { Repository } from 'typeorm';
interface KeywordWithImg extends Keyword {
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

  async getKeywordsByCategory(
    category: Keyword['category'],
    offset: number,
    limit: number,
  ) {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .select(['id', 'keyword', 'category'])
      .where('keyword.category = :category', { category: category })
      .limit(limit)
      .offset(offset)
      .orderBy('keyword', 'ASC')
      .getRawMany() as Promise<
      Array<Pick<Keyword, 'id' | 'keyword' | 'category'>>
    >;
  }

  async getKeywordById(id: number) {
    return this.keywordRepo
      .createQueryBuilder('keyword')
      .where('keyword.id = :id', { id: id })
      .leftJoinAndSelect('keyword_image', 'img')
      .getRawOne() as Promise<KeywordWithImg>;
  }

  async postKeyword(obj: Keyword) {
    return this.keywordRepo.create(obj);
  }

  async updateKeyword(obj: Keyword) {
    return this.keywordRepo.update({ id: obj.id }, obj);
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

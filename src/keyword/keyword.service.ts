import { Inject, Injectable } from '@nestjs/common';
import { Keyword } from 'src/entity/keyword.entity';
import { INF } from 'src/interface/common';
import { KeywordEdit, keywordCategory } from 'src/interface/keyword';
import { KeywordRepository } from 'src/repository/keyword/keyword.repository';
import { NewsRepository } from 'src/repository/news/news.repository';

@Injectable()
export class KeywordService {
  constructor(
    @Inject(KeywordRepository)
    private readonly keywordRepository: KeywordRepository,
    @Inject(NewsRepository)
    private readonly newsRepository: NewsRepository,
  ) {}

  async getKeywordsByOptions(
    offset: number = 0,
    limit: number = INF,
    option: {
      search: string;
      category: keywordCategory;
      isRecent: boolean;
    },
  ) {
    const { search, category, isRecent } = option;
    const qbProto = this.keywordRepository.getKeywordsShortProto(limit, offset);

    if (category) {
      this.keywordRepository.getKeywordsShortByCategory(qbProto, category);
    }

    if (search) {
      this.keywordRepository.getKeywordsShortBySearch(qbProto, search);
    }

    if (isRecent) {
      this.keywordRepository.getRecentKeywordsShort(qbProto);
    }

    const response = (await qbProto.getMany()) as Array<
      Pick<Keyword, 'id' | 'keyword' | 'category' | 'keywordImage'>
    >;
    return response;
  }

  async getKeywordsKeyList(offset: number, limit: number, search: string) {
    return await this.keywordRepository.getKeywordsKey(offset, limit, search);
  }

  async getKeywordById(id: number, isWithNews: boolean = false) {
    if (isWithNews) {
      return await this.keywordRepository.getKeywordByIdWithNews(id);
    } else {
      return await this.keywordRepository.getKeywordById(id);
    }
  }

  async getKeywordByKey(key: string, isWithNews: boolean = false) {
    if (isWithNews)
      return await this.keywordRepository.getKeywordByKeyWithNews(key);
    else {
      return await this.keywordRepository.getKeywordByKey(key);
    }
  }

  async getKeywordByKeyWithNews(key: string) {}

  async postKeyword(obj: KeywordEdit) {
    return await this.keywordRepository.postKeyword(obj);
  }

  async patchKeyword(id: number, obj: KeywordEdit) {
    return await this.keywordRepository.updateKeyword(id, obj);
  }

  async deleteKeywordById(id: number) {
    return await this.keywordRepository.deleteKeyword(id);
  }
}

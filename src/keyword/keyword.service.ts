import { Inject, Injectable } from '@nestjs/common';
import { Keyword } from 'src/entity/keyword.entity';
import { INF } from 'src/interface/common';
import { keywordCategory } from 'src/interface/keyword';
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

    return qbProto.getRawMany() as Promise<
      Array<Pick<Keyword, 'id' | 'keyword' | 'category' | 'keywordImage'>>
    >;
  }
}

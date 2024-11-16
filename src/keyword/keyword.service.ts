import { Inject, Injectable } from '@nestjs/common';
import { INF } from 'src/interface/common';
import { keywordCategory } from 'src/interface/keyword';
import { KeywordRepository } from 'src/repository/keyword/keyword.repository';
import { NewsRepository } from 'src/repository/news/news.repository';

@Injectable()
export class KeywordService {
  constructor(
    @Inject(KeywordRepository)
    private readonly keywordRepository,
    @Inject(NewsRepository)
    private readonly newsRepository,
  ) {}

  async getKeywordsByOptions(
    offset: number = 0,
    limit: number = INF,
    option: {
      search: string;
      category: keywordCategory;
    },
  ) {
    const { search, category } = option;

    if (category) {
      return await this.keywordRepository.getKeywordsByCategory(
        category,
        offset,
        limit,
      );
    } else {
      return await this.keywordRepository.getKeywordBySearch(
        search,
        offset,
        limit,
      );
    }
  }
}

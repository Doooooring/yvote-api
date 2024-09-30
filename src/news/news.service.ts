import { Inject, Injectable } from '@nestjs/common';
import { CommentRepository } from 'src/repository/comment/comment.repository';
import { KeywordRepository } from 'src/repository/keyword/keyword.repository';
import { NewsRepository } from 'src/repository/news/news.repository';

@Injectable()
export class NewsService {
  constructor(
    @Inject(NewsRepository)
    private readonly newsRepo: NewsRepository,
    @Inject(KeywordRepository)
    private readonly keywordRepo: KeywordRepository,
    @Inject(CommentRepository)
    private readonly commentRepo: CommentRepository,
  ) {}

  async getNewsIds() {
    const data = await this.newsRepo.getNewsIds();
    return data.map((d) => d.id);
  }

  async getNewsPreviews(
    page: number,
    limit: number,
    keyword: null | string,
    isAdmin?: boolean,
  ) {
    if (isAdmin) {
      if (keyword) {
        return this.newsRepo.getNewsPreviewsWithKeyword(page, limit, keyword);
      } else {
        return this.newsRepo.getNewsPreviewsAdmin(page, limit);
      }
    }

    if (keyword) {
      return this.newsRepo.getNewsPreviewsWithKeyword(page, limit, keyword);
    } else {
      return this.newsRepo.getNewsPreviews(page, limit);
    }
  }

  async getNewsToViewById(id: number) {
    return this.newsRepo.getNewsInView(id);
  }

  async getNewsToEditById(id: number) {
    return this.newsRepo.getNewsInEdit(id);
  }
}

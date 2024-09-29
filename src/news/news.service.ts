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

  async getNewsToViewById(id: number) {
    const data = await this.newsRepo.getNewsInView(id);
    return data;
  }

  async getNewsToEditById(id: number) {}

  async getNewsPreviews(page: number, limit: number, keyword: string) {}
}

import { Inject, Injectable } from '@nestjs/common';
import { NewsCommentType, NewsEdit } from 'src/interface/news';
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

  async getNewsToEditById(id: number) {
    const data = await this.newsRepo.getNewsById(id);
    return data;
  }

  async getNewsPreviews(
    page: number,
    limit: number,
    {
      keyword,
      isAdmin,
    }: {
      keyword?: string;
      isAdmin?: boolean;
    },
  ) {
    if (isAdmin) {
      return await this.newsRepo.getNewsPreviewsAdmin(page, limit, keyword);
    } else {
      return await this.newsRepo.getNewsPreviews(page, limit, keyword);
    }
  }

  async getNewsComment(
    newsId: number,
    type: NewsCommentType,
    offset: number,
    limit: number,
  ) {
    return await this.commentRepo.getCommentByNewsIdAndCommentType(
      newsId,
      type,
      offset,
      limit,
    );
  }

  async postNews(news: NewsEdit) {
    return await this.newsRepo.postNews(news);
  }

  async updateNewsCascade(id: number, news: NewsEdit) {
    if (!news.id) news.id = id;
    return this.newsRepo.postNews(news);
  }

  /**
   * @CAUTION
   * typeorm 'update' method bypasses relational updates
   */
  async updateNews(id: number, news: Partial<NewsEdit>) {
    return await this.newsRepo.updateNews(id, news);
  }
}

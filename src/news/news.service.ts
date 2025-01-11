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

  static fillNewsVacant() {}

  async getNewsIds() {
    const data = await this.newsRepo.getNewsIds();
    return data;
  }

  async getNewsTitles(search: string) {
    const data = await this.newsRepo.getNewsTitles(search);
    return data;
  }

  async getNewsToViewById(id: number) {
    const data = await this.newsRepo.getNewsInView(id);
    return data;
  }

  async getNewsToEditById(id: number) {
    const message = 'Start fetch news to edit id : ' + id;
    console.log(message);
    const data = await this.newsRepo.getNewsInEdit(id);
    const st = JSON.stringify(data);
    console.log('data size : ', st.length);

    return data;
  }

  async getNewsPreviews(
    page: number,
    limit: number,
    option: {
      keyword?: string;
      isAdmin?: boolean;
    },
  ) {
    return await this.newsRepo.getNewsPreviews(page, limit, option);
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

  async getRecentComments(offset: number, limit: number) {
    return await this.commentRepo.getCommentsRecentUpdated(offset, limit);
  }

  async postNews(news: NewsEdit) {
    return await this.newsRepo.postNews(news);
  }

  async updateNewsCascade(id: number, news: NewsEdit) {
    if (!news.id) news.id = id;

    return this.newsRepo.updateNews(id, news);
  }

  /**
   * @CAUTION
   * typeorm 'update' method bypasses relational updates
   */
  async updateNews(id: number, news: Partial<NewsEdit>) {
    return await this.newsRepo.updateNews(id, news);
  }

  async deleteNewsById(id: number) {
    return await this.newsRepo.deleteNewsById(id);
  }
}

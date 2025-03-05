import { Inject, Injectable } from '@nestjs/common';
import { Comment } from 'src/entity/comment.entity';
import {
  NewsCommentType,
  NewsEdit,
  NewsEditWithCommentTypes,
} from 'src/interface/news';
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
    const data = await this.newsRepo.getNewsInEdit(id);

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

  async saveCommentsByNewsId(
    newsId: number,
    commentType: NewsCommentType,
    comments: Comment[],
  ) {
    return await this.commentRepo.saveCommentsByNewsId(
      newsId,
      commentType,
      comments,
    );
  }

  async postNews(news: NewsEdit) {
    this.setNewsTimelineOrder(news);

    return await this.newsRepo.postNews(news);
  }

  async updateNewsCascade(id: number, news: Partial<NewsEditWithCommentTypes>) {
    const { comments = [], ...rest } = news;

    this.setNewsTimelineOrder(rest);

    const newsUpdate = await this.newsRepo.updateNews(id, rest);
    const commentsUpdate = await this.commentRepo.hydrateCommentsByCommentTypes(
      id,
      comments,
    );

    return true;
  }

  async deleteNewsById(id: number) {
    return await this.newsRepo.deleteNewsById(id);
  }

  setNewsTimelineOrder(news: Partial<NewsEdit>) {
    return news.timeline.map((t, idx) => {
      t.order = news.timeline.length - idx;
      return t;
    });
  }
}

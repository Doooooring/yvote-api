import { Inject, Injectable } from '@nestjs/common';
import { Comment } from 'src/entity/comment.entity';
import {
  NewsCommentType,
  NewsEdit,
  NewsEditWithCommentTypes,
  NewsState,
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

    data.summary = data.summaries.filter(
      (s) => s.commentType === NewsCommentType.와이보트,
    )[0]?.summary;

    if (!data.summary) {
      data.summary = data.summaries[0]?.summary ?? '';
    }

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
      state?: NewsState;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { state, ...rest } = option;
    const result = await this.newsRepo.getNewsPreviews(page, limit, {
      ...rest,
      state,
    });

    console.log(result);

    return result;
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

  async getRecentComments(
    offset: number,
    limit: number,
    type: NewsCommentType | null,
  ) {
    const option = {};
    if (type) option['type'] = type;
    return await this.commentRepo.getCommentsRecentUpdated(
      offset,
      limit,
      option,
    );
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

  async postNewsComment(newsId: number, commentType: NewsCommentType) {
    const comment = await this.newsRepo.createNewsSummary(newsId, commentType);
    return comment;
  }

  async updateNewsComment(
    newsId: number,
    prev: NewsCommentType,
    next: NewsCommentType,
  ) {
    const result = await this.newsRepo.convertNewsCommentType(
      newsId,
      prev,
      next,
    );

    return result;
  }

  async deleteNewsComment(newsId: number, commentType: NewsCommentType) {
    const result = await this.newsRepo.deleteNewsComment(newsId, commentType);
    return result;
  }

  async postNews(news: NewsEdit) {
    this.setNewsTimelineOrder(news);

    return await this.newsRepo.postNews(news);
  }

  async updateNewsCascade(id: number, news: Partial<NewsEditWithCommentTypes>) {
    const { comments: commentLeg, ...rest } = news;
    const { summaries } = rest;
    const comments = summaries.map((s) => s.commentType as NewsCommentType);

    this.setNewsTimelineOrder(rest);

    const newsUpdate = await this.newsRepo.updateNews(id, rest);

    const commentsUpdate = await this.commentRepo.hydrateCommentsByCommentTypes(
      id,
      comments,
    );

    const summaryUpdate =
      await this.newsRepo.hydrateNewsSummariesByCommentTypes(id, comments);

    return true;
  }

  async deleteNewsById(id: number) {
    return await this.newsRepo.deleteNewsById(id);
  }

  setNewsTimelineOrder(news: Partial<NewsEdit>) {
    return news.timeline.map((t, idx) => {
      t.order = idx;
      return t;
    });
  }
}

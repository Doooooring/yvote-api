import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';

export enum NewsState {
  Published = '0',
  Pending = '1',
  NotPublished = '2',
}

export enum NewsCommentType {
  입법부 = '입법부',
  전략가 = '전략가',
  지도자 = '지도자',
  예술가 = '예술가',
  감시자 = '감시자',
  운영자 = '운영자',
  공화주의자 = '공화주의자',
  관찰자 = '관찰자',
  개혁가 = '개혁가',
  이론가 = '이론가',
  자유주의자 = '자유주의자',
  더불어민주당 = '더불어민주당',
  국민의힘 = '국민의힘',
  대통령실 = '대통령실',
  행정부 = '행정부',
  헌법재판소 = '헌법재판소',
  와이보트 = '와이보트',
  기타 = '기타',
}

export enum NewsType {
  bill = 'bill',
  constitution = 'constitution',
  executive = 'executive',
  cabinet = 'cabinet',
  diplomat = 'diplomat',
  govern = 'govern',
  debate = 'debate',
  election = 'election',
  weekly = 'weekly',
  others = 'others',
}

export const newsTypesToKor = (newsType: NewsType) => {
  switch (newsType) {
    case NewsType.bill:
      return '법률';
    case NewsType.constitution:
      return '헌법재판소';
    case NewsType.executive:
      return '시행령';
    case NewsType.cabinet:
      return '국무회의';
    case NewsType.diplomat:
      return '정상외교';
    case NewsType.govern:
      return '행정';
    case NewsType.debate:
      return '논평';
    case NewsType.election:
      return '선거';
    case NewsType.weekly:
      return '일주일';
    case NewsType.others:
      return '기타';
    default:
      newsType satisfies never;
      throw new Error('Unknown news type');
  }
};

export interface NewsPreviews
  extends Pick<
    News,
    | 'id'
    | 'order'
    | 'title'
    | 'subTitle'
    | 'newsType'
    | 'slug'
    | 'summary'
    | 'summaries'
    | 'state'
    | 'isPublished'
    | 'newsImage'
    | 'timeline'
  > {
  keywords: Array<{
    id: number;
    keyword: string;
  }>;
}

export interface NewsEdit
  extends Omit<News, 'votes' | 'keywords' | 'comments'> {
  keywords: Array<{
    id: number;
    keyword: string;
  }>;
}

export interface NewsEditWithCommentTypes extends NewsEdit {
  comments: Array<NewsCommentType>;
}

export interface NewsinView extends Omit<News, 'comments' | 'keywords'> {
  comments: Array<NewsCommentType>;
  keywords: Array<Pick<Keyword, 'id' | 'keyword'>>;
}

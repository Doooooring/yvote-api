import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';

export enum NewsCommentType {
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

export interface NewsPreviews
  extends Pick<
    News,
    | 'id'
    | 'order'
    | 'title'
    | 'subTitle'
    | 'slug'
    | 'summary'
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

export interface NewsEdit extends Omit<News, 'votes' | 'keywords'> {
  keywords: Array<{
    id: number;
    keyword: string;
  }>;
}

export interface NewsinView extends Omit<News, 'comments' | 'keywords'> {
  comments: Array<NewsCommentType>;
  keywords: Array<Pick<Keyword, 'id' | 'keyword'>>;
}

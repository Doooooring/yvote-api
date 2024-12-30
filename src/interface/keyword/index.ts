import { Keyword } from 'src/entity/keyword.entity';

export enum keywordCategory {
  human = '인물',
  politics = '정치',
  policy = '정책 및 제도',
  economy = '경제',
  social = '사회',
  organizatioin = '단체',
  etc = '기타',
}

export interface KeywordEdit extends Omit<Keyword, 'id' | 'news'> {
  id?: number;
  news: Array<{
    id: number;
    title: string;
  }>;
}

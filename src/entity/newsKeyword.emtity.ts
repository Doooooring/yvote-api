import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { Keyword } from './keyword.entity';
import { News } from './news.entity';

@Entity({
  name: 'NewsKeyword',
  synchronize: false,
})
@Index(['news_id', 'keyword_id'])
export class NewsKeyword {
  @PrimaryColumn()
  id: number;

  @Column()
  news_id: string;

  @Column()
  keyword_id: string;

  @ManyToOne(() => News, (news) => news.newsKeywords)
  news: News;

  @ManyToOne(() => Keyword, (keyword) => keyword.id)
  keyword: Keyword;
}

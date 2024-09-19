import { Column, Entity, Index, ManyToMany, PrimaryColumn } from 'typeorm';
import { News } from './news.entity';

@Entity({
  name: 'Keyword',
})
export class Keyword {
  @PrimaryColumn()
  id: number;

  @Column()
  @Index()
  keyword: string;

  @Column()
  explain: string;

  @Column()
  category: string;

  @Column()
  recent: boolean;

  @ManyToMany(() => News, (news) => news.keywords)
  news: News[];
}

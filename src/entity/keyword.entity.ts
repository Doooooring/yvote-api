import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { ImageUrl } from './Image.entity';
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

  @OneToOne(() => ImageUrl)
  @JoinColumn({ name: 'keyword_image' })
  keyword_image?: ImageUrl;

  @ManyToMany(() => News, (news) => news.keywords)
  news: News[];
}

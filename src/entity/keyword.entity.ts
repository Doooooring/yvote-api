import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { News } from './news.entity';

@Entity({
  name: 'Keyword',
})
export class Keyword {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  @Index()
  keyword: string;

  @Column({ default: '' })
  explain: string;

  @Column()
  category: string;

  @Column({ default: false })
  recent: boolean;

  @Column({ nullable: true })
  keywordImage?: string;

  @ManyToMany(() => News, (news) => news.keywords)
  news: News[];
}

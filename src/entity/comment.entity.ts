import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { News } from './news.entity';

@Entity()
@Index(['news_id', 'comment_type'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order: number;

  @Column()
  news_id: string;

  @Column()
  comment_type: string;

  @Column()
  title: string;

  @Column()
  comment: string;

  @ManyToOne(() => News, (news) => news.comments)
  news: News;
}

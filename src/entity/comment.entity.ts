import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { News } from './news.entity';

@Entity({
  name: 'Comment',
})
@Index(['news', 'commentType'])
export class Comment {
  @PrimaryColumn('uuid')
  id: number;

  @Column()
  order: number;

  @Column()
  commentType: string;

  @Column()
  title: string;

  @Column()
  comment: string;

  @Column()
  date?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => News, (news) => news.comments)
  @JoinColumn({
    name: 'newsId',
  })
  news: News;
}

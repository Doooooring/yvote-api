import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { News } from './news.entity';

@Entity({
  name: 'Comment',
})
@Index(['news', 'commentType'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order: number;

  @Column()
  commentType: string;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'longtext', default: '' })
  comment: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  date?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => News, (news) => news.comments)
  @JoinColumn({
    name: 'newsId',
  })
  news: News;
}

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

  @Column({ type: 'longtext' })
  comment: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  date?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => News, (news) => news.comments, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: true,
  })
  @JoinColumn({
    name: 'newsId',
  })
  news: News;
}

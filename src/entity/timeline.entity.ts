import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { News } from './news.entity';

@Entity()
export class Timeline {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order: number;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  date?: Date;

  @Column({ default: '' })
  title: string;

  @Column({ default: '기타' })
  commentType: string;

  @ManyToOne(() => News, (news) => news.timeline, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: true,
  })
  @JoinColumn({
    name: 'newsId',
  })
  news: News;
}

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

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  date?: Date;

  @Column({ default: '' })
  title: string;

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

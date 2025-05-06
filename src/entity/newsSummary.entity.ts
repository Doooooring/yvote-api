import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { News } from './news.entity';

@Entity({
  name: 'NewsSummary',
})
export class NewsSummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '', type: 'longtext' })
  summary: string;

  @Column()
  commentType: string;

  @ManyToOne(() => News, (news) => news.summaries, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: true,
  })
  @JoinColumn({
    name: 'newsId',
  })
  news: News;
}

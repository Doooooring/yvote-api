import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { News } from './news.entity';

@Entity({
  name: 'NewsSummary',
})
export class NewsSummary {
  @PrimaryColumn()
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

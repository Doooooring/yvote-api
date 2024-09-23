import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { News } from './news.entity';

@Entity()
export class Timeline {
  @PrimaryColumn()
  id: string;

  @Column()
  date: Date;

  @Column()
  title: string;

  @ManyToOne(() => News, (news) => news.comments)
  @JoinColumn({
    name: 'news_id',
  })
  news: News;
}

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { News } from './news.entity';

@Entity()
export class Timeline {
  @PrimaryColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  title: string;

  @ManyToOne(() => News, (news) => news.comments)
  @JoinColumn({
    name: 'newsId',
  })
  news: News;
}

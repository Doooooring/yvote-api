import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { News } from './news.entity';

@Entity({
  name: 'Comment',
  synchronize: false,
})
@Index(['news_id', 'comment_type'])
export class Comment {
  @PrimaryColumn('uuid')
  id: number;

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

  @Column()
  date?: Date;

  @ManyToOne(() => News, (news) => news.comments)
  news: News;
}

import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { News } from './news.entity';
import { User } from './user.entity';

@Entity()
export class Vote {
  @PrimaryColumn()
  news_id: string;

  @PrimaryColumn()
  user_id: string;

  @Column()
  response: string;

  @ManyToOne(() => News, (news) => news.id)
  news: News;

  @ManyToOne(() => User, (user) => user.id)
  user: User;
}

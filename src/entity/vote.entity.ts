import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { News } from './news.entity';
import { User } from './user.entity';

@Entity({
  name: 'Vote',
  synchronize: false,
})
export class Vote {
  @PrimaryColumn()
  id: number;

  @Column()
  news_id: string;

  @Column()
  user_id: string;

  @Column()
  response: string;

  @ManyToOne(() => News, (news) => news.id)
  news: News;

  @ManyToOne(() => User, (user) => user.id)
  user: User;
}

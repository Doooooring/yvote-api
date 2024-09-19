import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { News } from './news.entity';
import { User } from './user.entity';

@Entity({
  name: 'Vote',
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
  @JoinColumn({
    name: 'news_id',
  })
  news: News;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({
    name: 'user_id',
  })
  user: User;
}

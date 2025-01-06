import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { News } from './news.entity';
import { User } from './user.entity';

@Entity({
  name: 'Vote',
})
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  response: string;

  @ManyToOne(() => News, (news) => news.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'newsId',
  })
  news: News;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'userId',
  })
  user: User;
}

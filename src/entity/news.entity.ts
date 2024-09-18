import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { NewsKeyword } from './newsKeyword.emtity';

export interface Timeline {
  title: string;
  date: string;
}

@Entity({
  name: 'News',
  synchronize: false,
})
export class News {
  @PrimaryColumn()
  id: number;

  @Column()
  order: number;

  @Column()
  title: string;

  @Column()
  summary: string;

  @Column()
  state: boolean;

  @Column()
  isPublished: boolean;

  @Column()
  opinions_left: string;

  @Column()
  opinions_right: string;

  @Column('json')
  timeline: any;

  @OneToMany(() => Comment, (comment) => comment.news)
  comments: Comment[];

  @OneToMany(() => NewsKeyword, (newsKeyword) => newsKeyword.news)
  newsKeywords: NewsKeyword[];
}

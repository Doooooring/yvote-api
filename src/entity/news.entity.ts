import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { Timeline } from './timeline.entity';
import { Keyword } from './keyword.entity';

export interface TimelineFactor {
  title: string;
  date: string;
}

@Entity({
  name: 'News',
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

  @OneToMany(() => Comment, (comment) => comment.news)
  comments: Comment[];

  @OneToMany(() => Timeline, (timeline) => timeline.news)
  timeline: Timeline[];

  @ManyToMany(() => Keyword, (keyword) => keyword.news, {})
  @JoinTable({
    name: 'NewsKeyword',
    joinColumn: {
      name: 'news_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'keyword_id',
      referencedColumnName: 'id',
    },
  })
  keywords: Keyword[];
}

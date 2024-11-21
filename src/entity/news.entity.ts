import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { Keyword } from './keyword.entity';
import { Timeline } from './timeline.entity';
import { Vote } from './vote.entity';

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
  opinionLeft: string;

  @Column()
  opinionRight: string;

  @Column()
  newsImage?: string;

  @OneToMany(() => Comment, (comment) => comment.news, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Timeline, (timeline) => timeline.news, { cascade: true })
  timeline: Timeline[];

  @OneToMany(() => Vote, (vote) => vote.news, { cascade: true })
  votes: Vote[];

  @ManyToMany(() => Keyword, (keyword) => keyword.news, {})
  @JoinTable({
    name: 'NewsKeyword',
    joinColumn: {
      name: 'newsId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'keywordId',
      referencedColumnName: 'id',
    },
  })
  keywords: Keyword[];
}

import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { Keyword } from './keyword.entity';
import { Timeline } from './timeline.entity';
import { Vote } from './vote.entity';
import { ImageUrl } from './newsImage.entity';

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
  opinion_left: string;

  @Column()
  opinion_right: string;

  @OneToOne(() => ImageUrl)
  @JoinColumn({ name: 'news_image' })
  news_image?: ImageUrl;

  @OneToMany(() => Comment, (comment) => comment.news)
  comments: Comment[];

  @OneToMany(() => Timeline, (timeline) => timeline.news)
  timeline: Timeline[];

  @OneToMany(() => Vote, (vote) => vote.news)
  votes: Vote[];

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

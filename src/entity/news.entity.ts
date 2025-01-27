import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
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
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order: number;

  @Column({ default: '' })
  title: string;

  @Column({ default: '' })
  subTitle: string;

  @Column({ default: '' })
  slug: string;

  @Column({ type: 'longtext' })
  summary: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  date?: Date;

  @Column({ default: false })
  state: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: '' })
  opinionLeft: string;

  @Column({ default: '' })
  opinionRight: string;

  @Column({ nullable: true })
  newsImage?: string;

  @OneToMany(() => Comment, (comment) => comment.news, {
    cascade: ['insert', 'update', 'remove', 'soft-remove', 'recover'],
  })
  comments: Comment[];

  @OneToMany(() => Timeline, (timeline) => timeline.news, {
    cascade: ['insert', 'update', 'remove', 'soft-remove', 'recover'],
  })
  timeline: Timeline[];

  @OneToMany(() => Vote, (vote) => vote.news, { cascade: true })
  votes: Vote[];

  @ManyToMany(() => Keyword, (keyword) => keyword.news, { cascade: true })
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

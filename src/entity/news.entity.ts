import { NewsState, NewsType } from 'src/interface/news';
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
import { NewsSummary } from './newsSummary.entity';
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

  @Column({ default: NewsType.others })
  newsType: NewsType;

  @Column({ default: '' })
  slug: string;

  @Column({ type: 'longtext' })
  summary: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  date?: Date;

  @Column({
    type: 'varchar',
    length: 2,
    default: NewsState.NotPublished,
  })
  state: NewsState;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: '' })
  opinionLeft: string;

  @Column({ default: '' })
  opinionRight: string;


  @Column({ type: 'longtext', nullable: true })
  agendaList?: string;

  @Column({ type: 'longtext', nullable: true })
  speechContent?: string;

  @Column({ nullable: true })
  newsImage?: string;

  @OneToMany(() => NewsSummary, (summary) => summary.news, {
    cascade: ['insert', 'update', 'remove', 'soft-remove', 'recover'],
  })
  summaries: NewsSummary[];

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

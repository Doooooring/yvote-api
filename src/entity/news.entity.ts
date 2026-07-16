import { NewsState, NewsType } from 'src/interface/news';
import {
  Column,
  Entity,
  Index,
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
// 제목 + 부제 통합 전문검색 인덱스
@Index('ft_news_title', ['title', 'subTitle'], { fulltext: true })
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'text', default: '' })
  subTitle: string;

  @Column({ default: NewsType.others })
  newsType: NewsType;

  @Column({ default: '' })
  slug: string;

  @Column({ type: 'longtext' })
  summary: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  date?: string;

  @Column({
    type: 'varchar',
    length: 2,
    default: NewsState.NotPublished,
  })
  state: NewsState;

  @Column({ default: '' })
  opinionLeft: string;

  @Column({ default: '' })
  opinionRight: string;

  @Column({ type: 'longtext', nullable: true })
  proDebate?: string;

  @Column({ type: 'longtext', nullable: true })
  conDebate?: string;

  // 타입별로 있을 수도/없을 수도 한 필드들을 담는 자유 JSON (스키마 나중에 정의)
  @Column({ type: 'json', nullable: true })
  detail?: Record<string, unknown>;

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

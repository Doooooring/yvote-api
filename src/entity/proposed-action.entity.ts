import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ProposedActionPayload,
  ProposedActionSource,
  ProposedActionStatus,
  ProposedActionType,
} from 'src/interface/proposed-action';
import { News } from './news.entity';

@Entity({
  name: 'ProposedAction',
})
@Index('idx_proposed_status', ['status'])
@Index('idx_proposed_newsId', ['newsId'])
export class ProposedAction {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', length: 32 })
  actionType: ProposedActionType;

  @Column({ type: 'simple-json' })
  payload: ProposedActionPayload;

  @Column({ type: 'varchar', length: 16, default: ProposedActionStatus.Pending })
  status: ProposedActionStatus;

  @Column({ type: 'timestamp', nullable: true })
  appliedAt?: Date;

  @Column({ type: 'int', nullable: true })
  newsId?: number;

  @ManyToOne(() => News, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'newsId' })
  news?: News;

  @Column({ type: 'varchar', length: 32 })
  source: ProposedActionSource;

  @Column({ type: 'text', nullable: true })
  note?: string;
}

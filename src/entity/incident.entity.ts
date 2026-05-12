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
  IncidentDetails,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
} from 'src/interface/incident';
import { News } from './news.entity';
import { ProposedAction } from './proposed-action.entity';

@Entity({
  name: 'Incident',
})
@Index('idx_incident_status', ['status'])
@Index('idx_incident_source', ['source'])
@Index('idx_incident_newsId', ['newsId'])
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', length: 32 })
  source: IncidentSource;

  @Column({ type: 'varchar', length: 16 })
  severity: IncidentSeverity;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'simple-json', nullable: true })
  details?: IncidentDetails;

  @Column({
    type: 'varchar',
    length: 16,
    default: IncidentStatus.Open,
  })
  status: IncidentStatus;

  @Column({ type: 'timestamp', nullable: true })
  dismissedAt?: Date;

  @Column({ type: 'int', nullable: true })
  newsId?: number;

  @ManyToOne(() => News, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'newsId' })
  news?: News;

  @Column({ type: 'int', nullable: true })
  proposedActionId?: number;

  @ManyToOne(() => ProposedAction, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'proposedActionId' })
  proposedAction?: ProposedAction;
}

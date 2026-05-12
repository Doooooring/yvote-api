import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from 'src/entity/incident.entity';
import {
  IncidentCreate,
  IncidentSource,
  IncidentStatus,
  IncidentUpdate,
} from 'src/interface/incident';

@Injectable()
export class IncidentRepository {
  constructor(
    @InjectRepository(Incident)
    private readonly repo: Repository<Incident>,
  ) {}

  async create(data: IncidentCreate) {
    const entity = this.repo.create({
      source: data.source,
      severity: data.severity,
      message: data.message,
      details: data.details ?? null,
      newsId: data.newsId ?? null,
      proposedActionId: data.proposedActionId ?? null,
    });
    return await this.repo.save(entity);
  }

  async findById(id: number) {
    return await this.repo.findOne({ where: { id } });
  }

  async list(options: {
    status?: IncidentStatus;
    source?: IncidentSource;
    newsId?: number;
    offset?: number;
    limit?: number;
  }) {
    const qb = this.repo
      .createQueryBuilder('inc')
      .orderBy('inc.createdAt', 'DESC');

    if (options.status) {
      qb.andWhere('inc.status = :status', { status: options.status });
    }
    if (options.source) {
      qb.andWhere('inc.source = :source', { source: options.source });
    }
    if (options.newsId !== undefined) {
      qb.andWhere('inc.newsId = :newsId', { newsId: options.newsId });
    }
    if (options.offset !== undefined) qb.skip(options.offset);
    if (options.limit !== undefined) qb.take(options.limit);

    return await qb.getMany();
  }

  async update(id: number, patch: IncidentUpdate) {
    const existing = await this.findById(id);
    if (!existing) return null;
    Object.assign(existing, patch);
    if (
      patch.status === IncidentStatus.Dismissed &&
      existing.dismissedAt == null
    ) {
      existing.dismissedAt = new Date();
    }
    return await this.repo.save(existing);
  }

  async delete(id: number) {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}

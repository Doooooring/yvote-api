import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposedAction } from 'src/entity/proposed-action.entity';
import {
  ProposedActionCreate,
  ProposedActionStatus,
  ProposedActionUpdate,
} from 'src/interface/proposed-action';

@Injectable()
export class ProposedActionRepository {
  constructor(
    @InjectRepository(ProposedAction)
    private readonly repo: Repository<ProposedAction>,
  ) {}

  async create(data: ProposedActionCreate) {
    const entity = this.repo.create({
      actionType: data.actionType,
      payload: data.payload,
      source: data.source,
      newsId: data.newsId ?? null,
      note: data.note ?? null,
    });
    return await this.repo.save(entity);
  }

  async findById(id: number) {
    return await this.repo.findOne({ where: { id } });
  }

  async list(options: {
    status?: ProposedActionStatus;
    newsId?: number;
    offset?: number;
    limit?: number;
  }) {
    const qb = this.repo
      .createQueryBuilder('pa')
      .orderBy('pa.createdAt', 'DESC');

    if (options.status) {
      qb.andWhere('pa.status = :status', { status: options.status });
    }
    if (options.newsId !== undefined) {
      qb.andWhere('pa.newsId = :newsId', { newsId: options.newsId });
    }
    if (options.offset !== undefined) qb.skip(options.offset);
    if (options.limit !== undefined) qb.take(options.limit);

    return await qb.getMany();
  }

  async update(id: number, patch: ProposedActionUpdate) {
    const existing = await this.findById(id);
    if (!existing) return null;
    Object.assign(existing, patch);
    if (
      patch.status === ProposedActionStatus.Applied &&
      existing.appliedAt == null
    ) {
      existing.appliedAt = new Date();
    }
    return await this.repo.save(existing);
  }

  async delete(id: number) {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}

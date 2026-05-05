import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProposedAction } from 'src/entity/proposed-action.entity';
import {
  ProposedActionCreate,
  ProposedActionStatus,
  ProposedActionUpdate,
} from 'src/interface/proposed-action';

@Injectable()
export class ProposedActionRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProposedAction)
    private readonly repo: Repository<ProposedAction>,
  ) {}

  private toEntityInput(data: ProposedActionCreate) {
    return {
      actionType: data.actionType,
      payload: data.payload,
      source: data.source,
      newsId: data.newsId ?? null,
      note: data.note ?? null,
    };
  }

  async create(data: ProposedActionCreate) {
    const entity = this.repo.create(this.toEntityInput(data));
    return await this.repo.save(entity);
  }

  async createBatch(actions: ProposedActionCreate[]) {
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ProposedAction);
      const entities = actions.map((data) => repo.create(this.toEntityInput(data)));
      return await repo.save(entities);
    });
  }

  async findById(id: number) {
    return await this.repo.findOne({ where: { id } });
  }

  async list(options: {
    /** One or more statuses. Single → `status = :s`, multiple → `status IN (...)`. */
    statuses?: string[];
    newsId?: number;
    actionType?: string;
    note?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    offset?: number;
    limit?: number;
  }) {
    const qb = this.repo
      .createQueryBuilder('pa')
      .orderBy('pa.createdAt', 'DESC');

    if (options.statuses && options.statuses.length > 0) {
      if (options.statuses.length === 1) {
        qb.andWhere('pa.status = :status', { status: options.statuses[0] });
      } else {
        qb.andWhere('pa.status IN (:...statuses)', { statuses: options.statuses });
      }
    }
    if (options.newsId !== undefined) {
      qb.andWhere('pa.newsId = :newsId', { newsId: options.newsId });
    }
    if (options.actionType !== undefined) {
      qb.andWhere('pa.actionType = :actionType', { actionType: options.actionType });
    }
    if (options.note !== undefined && options.note !== '') {
      // LIKE substring match. note is plain text, no special-char
      // escaping needed beyond TypeORM's parameter binding.
      qb.andWhere('pa.note LIKE :note', { note: `%${options.note}%` });
    }
    if (options.createdAfter !== undefined) {
      qb.andWhere('pa.createdAt >= :createdAfter', {
        createdAfter: options.createdAfter,
      });
    }
    if (options.createdBefore !== undefined) {
      qb.andWhere('pa.createdAt <= :createdBefore', {
        createdBefore: options.createdBefore,
      });
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

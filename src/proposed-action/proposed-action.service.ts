import { Inject, Injectable } from '@nestjs/common';
import { ProposedActionRepository } from 'src/repository/proposed-action/proposed-action.repository';
import {
  ProposedActionCreate,
  ProposedActionStatus,
  ProposedActionUpdate,
} from 'src/interface/proposed-action';

@Injectable()
export class ProposedActionService {
  constructor(
    @Inject(ProposedActionRepository)
    private readonly repo: ProposedActionRepository,
  ) {}

  async create(data: ProposedActionCreate) {
    return await this.repo.create(data);
  }

  async getById(id: number) {
    return await this.repo.findById(id);
  }

  async list(options: {
    status?: ProposedActionStatus;
    newsId?: number;
    offset?: number;
    limit?: number;
  }) {
    return await this.repo.list(options);
  }

  async update(id: number, patch: ProposedActionUpdate) {
    return await this.repo.update(id, patch);
  }

  async approve(id: number) {
    return await this.repo.update(id, { status: ProposedActionStatus.Approved });
  }

  async reject(id: number) {
    return await this.repo.update(id, { status: ProposedActionStatus.Rejected });
  }

  async markApplied(id: number) {
    return await this.repo.update(id, { status: ProposedActionStatus.Applied });
  }

  async delete(id: number) {
    return await this.repo.delete(id);
  }
}

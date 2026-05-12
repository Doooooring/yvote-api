import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IncidentRepository } from 'src/repository/incident/incident.repository';
import {
  IncidentCreate,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentUpdate,
} from 'src/interface/incident';

const ALLOWED_SOURCES = new Set<string>(Object.values(IncidentSource));
const ALLOWED_SEVERITIES = new Set<string>(Object.values(IncidentSeverity));
const ALLOWED_STATUSES = new Set<string>(Object.values(IncidentStatus));

@Injectable()
export class IncidentService {
  constructor(
    @Inject(IncidentRepository)
    private readonly repo: IncidentRepository,
  ) {}

  async create(data: IncidentCreate) {
    if (!data || !data.source || !ALLOWED_SOURCES.has(data.source)) {
      throw new BadRequestException(
        `incident: source must be one of ${[...ALLOWED_SOURCES].join(', ')}`,
      );
    }
    if (!data.severity || !ALLOWED_SEVERITIES.has(data.severity)) {
      throw new BadRequestException(
        `incident: severity must be one of ${[...ALLOWED_SEVERITIES].join(', ')}`,
      );
    }
    if (!data.message || typeof data.message !== 'string') {
      throw new BadRequestException('incident: `message` (string) is required');
    }
    return await this.repo.create(data);
  }

  async getById(id: number) {
    return await this.repo.findById(id);
  }

  async list(options: {
    status?: IncidentStatus;
    source?: IncidentSource;
    newsId?: number;
    offset?: number;
    limit?: number;
  }) {
    return await this.repo.list(options);
  }

  async update(id: number, patch: IncidentUpdate) {
    if (patch && patch.status !== undefined && !ALLOWED_STATUSES.has(patch.status)) {
      throw new BadRequestException(
        `incident: unknown status '${patch.status}'. ` +
          `Allowed: ${[...ALLOWED_STATUSES].join(', ')}`,
      );
    }
    return await this.repo.update(id, patch);
  }

  async dismiss(id: number) {
    return await this.repo.update(id, { status: IncidentStatus.Dismissed });
  }

  async resolve(id: number) {
    return await this.repo.update(id, { status: IncidentStatus.Resolved });
  }

  async delete(id: number) {
    return await this.repo.delete(id);
  }
}

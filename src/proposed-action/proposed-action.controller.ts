import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { RespInterceptor } from 'src/tools/decorator';
import {
  ProposedActionCreate,
  ProposedActionUpdate,
} from 'src/interface/proposed-action';
import { ProposedActionService } from './proposed-action.service';

@LogRequests()
@Controller('proposed-action')
export class ProposedActionController {
  constructor(
    @Inject(ProposedActionService)
    private readonly svc: ProposedActionService,
  ) {}

  @Post()
  @RespInterceptor
  async create(@Body() body: ProposedActionCreate) {
    return await this.svc.create(body);
  }

  @Get()
  @RespInterceptor
  async list(
    @Query('status') status?: string,
    @Query('newsId') newsId?: number,
    @Query('actionType') actionType?: string,
    @Query('note') note?: string,
    @Query('createdAfter') createdAfter?: string,
    @Query('createdBefore') createdBefore?: string,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    // status accepts either a single value (e.g. "waiting") or a
    // comma-separated list (e.g. "waiting,approved,applied") for an
    // indexed `status IN (...)` query. Empty strings ignored.
    const parsedStatuses =
      status === undefined || status === ''
        ? undefined
        : status.split(',').map((s) => s.trim()).filter(Boolean);

    return await this.svc.list({
      statuses: parsedStatuses,
      newsId: newsId !== undefined ? Number(newsId) : undefined,
      actionType: actionType || undefined,
      note: note || undefined,
      createdAfter: createdAfter || undefined,
      createdBefore: createdBefore || undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @RespInterceptor
  async getById(@Param('id') id: number) {
    return await this.svc.getById(Number(id));
  }

  @Patch(':id/approve')
  @RespInterceptor
  async approve(@Param('id') id: number) {
    return await this.svc.approve(Number(id));
  }

  @Patch(':id/reject')
  @RespInterceptor
  async reject(@Param('id') id: number) {
    return await this.svc.reject(Number(id));
  }

  @Patch(':id/applied')
  @RespInterceptor
  async markApplied(@Param('id') id: number) {
    return await this.svc.markApplied(Number(id));
  }

  @Patch(':id')
  @RespInterceptor
  async update(
    @Param('id') id: number,
    @Body() body: ProposedActionUpdate,
  ) {
    return await this.svc.update(Number(id), body);
  }

  @Delete(':id')
  @RespInterceptor
  async delete(@Param('id') id: number) {
    return await this.svc.delete(Number(id));
  }
}

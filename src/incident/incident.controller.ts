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
  IncidentCreate,
  IncidentSource,
  IncidentStatus,
  IncidentUpdate,
} from 'src/interface/incident';
import { IncidentService } from './incident.service';

@LogRequests()
@Controller('incident')
export class IncidentController {
  constructor(
    @Inject(IncidentService)
    private readonly svc: IncidentService,
  ) {}

  @Post()
  @RespInterceptor
  async create(@Body() body: IncidentCreate) {
    return await this.svc.create(body);
  }

  @Get()
  @RespInterceptor
  async list(
    @Query('status') status?: IncidentStatus,
    @Query('source') source?: IncidentSource,
    @Query('newsId') newsId?: number,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.svc.list({
      status,
      source,
      newsId: newsId !== undefined ? Number(newsId) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @RespInterceptor
  async getById(@Param('id') id: number) {
    return await this.svc.getById(Number(id));
  }

  @Patch(':id/dismiss')
  @RespInterceptor
  async dismiss(@Param('id') id: number) {
    return await this.svc.dismiss(Number(id));
  }

  @Patch(':id/resolve')
  @RespInterceptor
  async resolve(@Param('id') id: number) {
    return await this.svc.resolve(Number(id));
  }

  @Patch(':id')
  @RespInterceptor
  async update(@Param('id') id: number, @Body() body: IncidentUpdate) {
    return await this.svc.update(Number(id), body);
  }

  @Delete(':id')
  @RespInterceptor
  async delete(@Param('id') id: number) {
    return await this.svc.delete(Number(id));
  }
}

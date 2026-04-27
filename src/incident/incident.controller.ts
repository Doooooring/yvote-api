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
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/auth/admin/admin.guard';
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

  @UseGuards(AdminGuard)
  @Post()
  @RespInterceptor
  async create(@Body() body: IncidentCreate) {
    return await this.svc.create(body);
  }

  @UseGuards(AdminGuard)
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

  @UseGuards(AdminGuard)
  @Get(':id')
  @RespInterceptor
  async getById(@Param('id') id: number) {
    return await this.svc.getById(Number(id));
  }

  @UseGuards(AdminGuard)
  @Patch(':id/dismiss')
  @RespInterceptor
  async dismiss(@Param('id') id: number) {
    return await this.svc.dismiss(Number(id));
  }

  @UseGuards(AdminGuard)
  @Patch(':id/resolve')
  @RespInterceptor
  async resolve(@Param('id') id: number) {
    return await this.svc.resolve(Number(id));
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  @RespInterceptor
  async update(@Param('id') id: number, @Body() body: IncidentUpdate) {
    return await this.svc.update(Number(id), body);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  @RespInterceptor
  async delete(@Param('id') id: number) {
    return await this.svc.delete(Number(id));
  }
}

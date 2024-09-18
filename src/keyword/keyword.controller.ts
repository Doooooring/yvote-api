import { Controller, Get, Query } from '@nestjs/common';

@Controller('keyword')
export class KeywordController {
  @Get('keywords')
  getKeywordTitles(
    @Query('search')
    search: string = '',
    @Query('offset')
    offset: number,
    @Query('limit')
    limit: number,
  ) {}
}

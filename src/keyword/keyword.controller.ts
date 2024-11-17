import { Controller, Get, Inject, Query } from '@nestjs/common';
import { keywordCategory } from 'src/interface/keyword';
import { KeywordService } from './keyword.service';

@Controller('keyword')
export class KeywordController {
  constructor(
    @Inject(KeywordService)
    private readonly keywordService,
  ) {}

  @Get('keywords')
  async getKeywordTitles(
    @Query('search')
    search: string = '',
    @Query('category')
    category: keywordCategory,
    @Query('isRecent')
    isRecent: boolean = false,
    @Query('offset')
    offset: number,
    @Query('limit')
    limit: number,
  ) {
    return await this.keywordService.getKeywordsByOptions(offset, limit, {
      search,
      category,
      isRecent,
    });
  }
}

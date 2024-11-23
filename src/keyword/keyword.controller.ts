import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { KeywordEdit, keywordCategory } from 'src/interface/keyword';
import { RespInterceptor } from 'src/tools/decorator';
import { KeywordService } from './keyword.service';

@Controller('keyword')
export class KeywordController {
  constructor(
    @Inject(KeywordService)
    private readonly keywordService: KeywordService,
  ) {}

  @Get('/keywords')
  @RespInterceptor
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

  @Get('/')
  @RespInterceptor
  async getKeywordByOption(@Query('id') id: number, @Query('key') key: string) {
    if (id) {
      return await this.keywordService.getKeywordById(id);
    }

    if (key) {
      return await this.keywordService.getKeywordByKey(key);
    }
  }

  @Post('/edit')
  @RespInterceptor
  async postKeyword(@Body() body: KeywordEdit) {
    return await this.keywordService.postKeyword(body);
  }

  @Patch('/edit/:id')
  @RespInterceptor
  async patchKeywordById(@Body() body: KeywordEdit, @Param() id: number) {
    return await this.keywordService.patchKeyword(id, body);
  }
}

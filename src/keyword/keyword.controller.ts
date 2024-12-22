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
import { INF } from 'src/interface/common';
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

  @Get('/key-list')
  @RespInterceptor
  async getKeywordKeyList(
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = INF,
    @Query('search') search: string = '',
  ) {
    return await this.keywordService.getKeywordsKeyList(offset, limit, search);
  }

  @UseGuards(AdminGuard)
  @Post('/edit')
  @RespInterceptor
  async postKeyword(@Body() body: { keyword: KeywordEdit }) {
    const { keyword } = body;
    return await this.keywordService.postKeyword(keyword);
  }

  @UseGuards(AdminGuard)
  @Patch('/edit/:id')
  @RespInterceptor
  async patchKeywordById(
    @Body() body: { keyword: KeywordEdit },
    @Param('id') id: number,
  ) {
    const { keyword } = body;
    return await this.keywordService.patchKeyword(id, keyword);
  }

  @UseGuards(AdminGuard)
  @Delete('/edit/:id')
  @RespInterceptor
  async deleteKeywordById(@Param('id') id: number) {
    return await this.keywordService.deleteKeywordById(id);
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
}

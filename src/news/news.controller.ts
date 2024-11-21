import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { NewsCommentType, NewsEdit } from 'src/interface/news';
import { RespInterceptor } from 'src/tools/decorator';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(
    @Inject(NewsService)
    private readonly newsService: NewsService,
  ) {}

  // @Get()
  // getAllNews(@Req() req: Request, @Res() res: Response) {
  //   res.send('');
  // }

  @Get('/test')
  @RespInterceptor
  async newsControllerTest() {
    const news = await this.newsService.getNewsIds();
    return news;
  }

  @Get('/previews')
  @RespInterceptor
  async getNewsPreviews(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('keyword') keyword: string,
    @Query('isAdmin') isAdmin: boolean = false,
  ) {
    const response = await this.newsService.getNewsPreviews(page, limit, {
      keyword,
      isAdmin,
    });
    return response;
  }

  @Get('/comment-updated')
  @RespInterceptor
  async getRecentComments(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ) {
    return await this.newsService.getRecentComments(offset, limit);
  }

  @Post('/edit')
  @RespInterceptor
  async postNewsToEdit(@Body() body: NewsEdit) {
    const response = await this.newsService.postNews(body);
    return { state: true };
  }

  @Get('/:id')
  @RespInterceptor
  async getNewsToViewById(@Param('id') id: number, @Res() res: Response) {
    const news = await this.newsService.getNewsToViewById(id);
    return news;
  }

  @Get('/edit/:id')
  @RespInterceptor
  async getNewsToEditById(@Param('id') id: number, @Res() res: Response) {
    const news = await this.newsService.getNewsToEditById(id);
    return news;
  }

  @Patch('/edit/:id')
  @RespInterceptor
  async updateNewsToEditById(@Param('id') id: number, @Body() body: NewsEdit) {
    const news = await this.newsService.updateNewsCascade(id, body);
    return news;
  }

  @Get('/:id/vote')
  getVoteInfoByNewsId(
    @Headers('authorization')
    authorization: string,
    @Param('id')
    id: number,
  ) {}

  @Get('/:id/comment')
  async getNewsComment(
    @Param('id') id: number,
    @Query('type') type: NewsCommentType,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ) {
    return await this.newsService.getNewsComment(id, type, offset, limit);
  }
}

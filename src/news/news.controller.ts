import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NewsService } from './news.service';
import { RespInterceptor } from 'src/tools/decorator';

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

  @Post()
  async postNewsToEdit(@Body() body) {}

  @Get('/test')
  @RespInterceptor
  async newsControllerTest(@Req() req: Request, @Res() res: Response) {
    const news = await this.newsService.getNewsIds();
    return news;
  }

  @Get(':id')
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

  @Post('/edit/:id')
  async updateNewsToEditById(@Param('id') id: number) {}

  @Get('preview')
  @RespInterceptor
  async getNewsPreviews(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('keyword') keyword: string,
    @Query('isAdmin') isAdmin: boolean = false,
    @Res() res: Response,
  ) {
    const response = await this.newsService.getNewsPreviews(page, limit, {
      keyword,
      isAdmin,
    });
    return response;
  }

  @Get(':id/vote')
  getVoteInfoByNewsId(
    @Headers('authorization')
    authorization: string,
    @Param('id')
    id: number,
  ) {}

  @Get('/:id/comment')
  getNewsComment(
    @Param('id') id: number,
    @Query('type') type: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {}
}

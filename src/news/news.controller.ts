import {
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
  async newsControllerTest(@Req() req: Request, @Res() res: Response) {
    const news = await this.newsService.getNewsIds();
    console.log(news);
    res.send({ data: news });
  }

  @Get(':id')
  getNewsToViewById(@Param('id') id: number, @Res() res: Response) {
    res.send('');
  }

  @Get('preview')
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
    res.send(response);
  }

  @Get('keyword')
  getNewsByKeyword(@Param('keyword') keyword: string, @Res() res: Response) {
    res.send();
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

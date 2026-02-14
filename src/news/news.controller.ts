import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/auth/admin/admin.guard';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { News } from 'src/entity/news.entity';
import {
  NewsCommentType,
  NewsEdit,
  NewsEditWithCommentTypes,
} from 'src/interface/news';
import { OpenAIService } from 'src/openai/openai.service';
import { RespInterceptor } from 'src/tools/decorator';
import { NewsService } from './news.service';

@LogRequests()
@Controller('news')
export class NewsController {
  constructor(
    @Inject(NewsService)
    private readonly newsService: NewsService,
    @Inject(OpenAIService)
    private readonly openAIService: OpenAIService,
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

  @Get('/ids')
  @RespInterceptor
  async getNewsIds() {
    const news = await this.newsService.getNewsIds();
    return news;
  }

  @Get('/titles')
  @RespInterceptor
  async getNewsTitles(@Query('search') search: string = '') {
    const news = await this.newsService.getNewsTitles(search);
    return news;
  }

  @Get('/previews')
  @RespInterceptor
  async getNewsPreviews(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    @Query('keyword') keyword: string,
    @Query('state') state?: News['state'],
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const response = await this.newsService.getNewsPreviews(offset, limit, {
      keyword,
      state,
      startDate,
      endDate,
    });

    console.log(response);

    return response;
  }

  @Get('/comment-updated')
  @RespInterceptor
  async getRecentComments(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    @Query('type') type?: NewsCommentType,
  ) {
    const response = await this.newsService.getRecentComments(
      offset,
      limit,
      type ?? null,
    );
    return response;
  }

  @UseGuards(AdminGuard)
  @Post('/edit')
  @RespInterceptor
  async postNewsToEdit(@Body() body: { news: NewsEdit }) {
    const { news } = body;
    const response = await this.newsService.postNews(news);
    return response;
  }

  @Get('/:id')
  @RespInterceptor
  async getNewsToViewById(@Param('id') id: number) {
    const news = await this.newsService.getNewsToViewById(id);
    return news;
  }

  @Get('/edit/:id')
  @RespInterceptor
  async getNewsToEditById(@Param('id') id: number) {
    const news = await this.newsService.getNewsToEditById(id);

    return news;
  }

  @UseGuards(AdminGuard)
  @Patch('/edit/:id/comments/:commentType')
  @RespInterceptor
  async updateCommentsByNewsId(
    @Param('id') id: number,
    @Param('commentType') commentType: NewsCommentType,
    @Body() body: { comments: News['comments'] },
  ) {
    const { comments } = body;
    const response = await this.newsService.saveCommentsByNewsId(
      id,
      commentType,
      comments,
    );
    return true;
  }

  @UseGuards(AdminGuard)
  @Post('/edit/:id/comment_type')
  @RespInterceptor
  async generateNewsComment(
    @Param('id') id: number,
    @Body() body: { commentType: NewsCommentType },
  ) {
    const { commentType } = body;
    const response = await this.newsService.postNewsComment(id, commentType);

    return true;
  }

  @UseGuards(AdminGuard)
  @Patch('/edit/:id/comment_type')
  @RespInterceptor
  async changeNewsComment(
    @Param('id') id: number,
    @Body() body: { prev: NewsCommentType; next: NewsCommentType },
  ) {
    const { prev, next } = body;
    const response = await this.newsService.updateNewsComment(id, prev, next);

    return true;
  }

  @UseGuards(AdminGuard)
  @Delete('/edit/:id/comment_type/:commentType')
  @RespInterceptor
  async deleteNewsComment(
    @Param('id') id: number,
    @Param('commentType') commentType: NewsCommentType,
  ) {
    const response = await this.newsService.deleteNewsComment(id, commentType);

    return true;
  }

  @UseGuards(AdminGuard)
  @Patch('/edit/:id')
  @RespInterceptor
  async updateNewsToEditById(
    @Param('id') id: number,
    @Body() body: { news: NewsEditWithCommentTypes },
  ) {
    const { news } = body;
    const response = await this.newsService.updateNewsCascade(id, news);
    return true;
  }

  @UseGuards(AdminGuard)
  @Delete('/edit/:id')
  @RespInterceptor
  async deleteNewsById(@Param('id') id: number) {
    const response = await this.newsService.deleteNewsById(id);
    return true;
  }

  @Get('/:id/vote')
  @RespInterceptor
  getVoteInfoByNewsId(
    @Headers('authorization')
    authorization: string,
    @Param('id')
    id: number,
  ) {}

  @Get('/:id/comment')
  @RespInterceptor
  async getNewsComment(
    @Param('id') id: number,
    @Query('type') type: NewsCommentType,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ) {
    return await this.newsService.getNewsComment(id, type, offset, limit);
  }
}

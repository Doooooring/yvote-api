import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('news')
export class NewsController {
  @Get()
  getAllNews(@Req() req: Request, @Res() res: Response) {
    res.send('');
  }

  @Get(':id')
  getNewsById(@Param('id') id: string, @Res() res: Response) {
    res.send('');
  }

  @Get('preview')
  getNewsPreviews(
    @Param('page') page: number,
    @Param('limit') limit: number,
    @Param('keyword') keyword: string,
    @Res() res: Response,
  ) {
    res.send('');
  }
}

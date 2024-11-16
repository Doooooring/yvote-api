import { Controller, Inject, Param, Post, Req } from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';

@Controller('img')
export class ImgController {
  constructor(
    @Inject(AwsService)
    private readonly awsService: AwsService,
  ) {}

  @Post('/')
  postImg(@Req() req) {
    const img = req.file?.buffer;
    if (img === undefined) {
      Error("image doesn't exist");
      return;
    }
  }
}

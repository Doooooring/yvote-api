import { Controller, Inject, Param, Post, Query, Req } from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';
import { genDateId } from 'src/tools/common';

@Controller('img')
export class ImgController {
  constructor(
    @Inject(AwsService)
    private readonly awsService: AwsService,
  ) {}

  @Post('/')
  async postImg(@Req() req, @Query('filename') filename: string) {
    const img = req.file?.buffer as Buffer;
    if (img === undefined) {
      Error("image doesn't exist");
      return;
    }

    const name = filename ?? genDateId();

    const resp = await this.awsService.imageUploadToS3(name, img, 'webp');
  }
}

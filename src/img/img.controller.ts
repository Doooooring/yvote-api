import { Controller, Inject, Post, Query, Req } from '@nestjs/common';
import sharp from 'sharp';
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
      throw Error();
    }

    const imgWEBP = await sharp(img).webp({}).toBuffer();
    const name = filename ?? genDateId();

    const imgAddress = await this.awsService.imageUploadToS3(
      name,
      imgWEBP,
      'webp',
    );

    return imgAddress;
  }
}

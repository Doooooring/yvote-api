import { Controller, Inject, Post, Req } from '@nestjs/common';
import sharp from 'sharp';
import { AwsService } from 'src/aws/aws.service';

@Controller('img')
export class ImgController {
  constructor(
    @Inject(AwsService)
    private readonly awsService: AwsService,
  ) {}

  @Post('/')
  async postImg(@Req() req) {
    const img = req.file?.buffer as Buffer;
    const filename = req.file?.originalname as string; // Getting the original filename

    if (img === undefined) {
      throw Error();
    }

    const imgWEBP = await sharp(img).webp({}).toBuffer();

    const imgAddress = await this.awsService.imageUploadToS3(
      filename,
      imgWEBP,
      'webp',
    );

    return imgAddress;
  }
}

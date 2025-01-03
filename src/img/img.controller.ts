import {
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as sharp from 'sharp';
import { AwsService } from 'src/aws/aws.service';
import { RespInterceptor } from 'src/tools/decorator';

@Controller('/img')
export class ImgController {
  constructor(
    @Inject(AwsService)
    private readonly awsService: AwsService,
  ) {}

  @Post('/')
  @UseInterceptors(FileInterceptor('img'))
  @RespInterceptor
  async postImg(@UploadedFile() file: Express.Multer.File) {
    const img = file?.buffer as Buffer;
    const filename = file?.originalname as string;

    if (img === undefined) {
      throw Error('IMG undefined');
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

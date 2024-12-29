import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { response } from 'express';

@Injectable()
export class AwsService {
  s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_PUBLIC_KEY'),
        secretAccessKey: this.configService.get('AWS_ACCESS_KEY'),
      },
    });
  }

  async imageUploadToS3(fileName: string, file: Buffer, ext: string) {
    const AWS_REGION = this.configService.get('AWS_REGION');
    const AWS_S3_BUCKET_NAME = this.configService.get('AWS_S3_BUCKET_NAME');

    console.log('aws_region : ', AWS_REGION);
    console.log('aws_s3 bucket name: ', AWS_S3_BUCKET_NAME);

    try {
      const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: file,
        ACL: 'public-read',
        ContentType: `image/${ext}`,
      });

      const resposne = await this.s3Client.send(command);
      console.log(response);
      return `https://s3.${AWS_REGION}.amazonaws.com/${AWS_S3_BUCKET_NAME}/${fileName}`;
    } catch (e) {
      console.log(e);
      return '';
    }
  }
}

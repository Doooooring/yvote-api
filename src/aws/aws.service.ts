import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { genDateId } from 'src/tools/common';

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

    const neFilename = fileName + genDateId();
    try {
      const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: neFilename,
        Body: file,
        ACL: 'public-read',
        ContentType: `image/${ext}`,
      });

      const response = await this.s3Client.send(command);
      return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${neFilename}`;
    } catch (e) {
      console.log(e);
      return '';
    }
  }
}

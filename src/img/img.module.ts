import { Module } from '@nestjs/common';
import { AwsModule } from 'src/aws/aws.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { ImgController } from './img.controller';

@Module({
  controllers: [ImgController],
  providers: [],
  imports: [AwsModule],
})
export class ImgModule {}

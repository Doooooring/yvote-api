import { Module } from '@nestjs/common';
import { AwsModule } from 'src/aws/aws.module';
import { AwsService } from 'src/aws/aws.service';
import { KeywordModule } from 'src/keyword/keyword.module';
import { KeywordService } from 'src/keyword/keyword.service';
import { NewsModule } from 'src/news/news.module';
import { NewsService } from 'src/news/news.service';
import { MigrationController } from './migration.controller';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  controllers: [MigrationController],
  imports: [RepositoryModule, AwsModule, NewsModule, KeywordModule],
  providers: [AwsService, NewsService, KeywordService],
})
export class MigrationModule {}

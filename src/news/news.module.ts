import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { KeywordService } from 'src/keyword/keyword.service';
import { OpenAIService } from 'src/openai/openai.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  controllers: [NewsController],
  providers: [NewsService, KeywordService, OpenAIService],
  imports: [RepositoryModule, JwtModule, AuthModule],
  exports: [NewsService],
})
export class NewsModule {}

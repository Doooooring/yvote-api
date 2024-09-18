import { Module } from '@nestjs/common';
import { NewsModule } from 'src/news/news.module';
import { KeywordController } from './keyword.controller';
import { KeywordService } from './keyword.service';

@Module({
  controllers: [KeywordController],
  providers: [KeywordService],
  imports: [NewsModule],
  exports: [KeywordService],
})
export class KeywordModule {}

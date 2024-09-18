import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/repository/repository.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  controllers: [NewsController],
  providers: [NewsService],
  imports: [RepositoryModule],
})
export class NewsModule {}

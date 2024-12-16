import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  controllers: [NewsController],
  providers: [NewsService],
  imports: [RepositoryModule, JwtModule, AuthModule],
  exports: [NewsService],
})
export class NewsModule {}

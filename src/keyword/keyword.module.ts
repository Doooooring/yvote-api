import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { NewsModule } from 'src/news/news.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { KeywordController } from './keyword.controller';
import { KeywordService } from './keyword.service';

@Module({
  controllers: [KeywordController],
  providers: [KeywordService],
  imports: [NewsModule, RepositoryModule, JwtModule, AuthModule],
  exports: [KeywordService],
})
export class KeywordModule {}

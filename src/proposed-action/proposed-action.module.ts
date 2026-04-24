import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { ProposedActionController } from './proposed-action.controller';
import { ProposedActionService } from './proposed-action.service';

@Module({
  controllers: [ProposedActionController],
  providers: [ProposedActionService],
  imports: [RepositoryModule, JwtModule, AuthModule],
  exports: [ProposedActionService],
})
export class ProposedActionModule {}

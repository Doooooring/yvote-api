import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';

@Module({
  controllers: [IncidentController],
  providers: [IncidentService],
  imports: [RepositoryModule, JwtModule, AuthModule],
  exports: [IncidentService],
})
export class IncidentModule {}

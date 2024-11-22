import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { KakakoAuthService } from './kakao/kakao.service';
import { GoogleAuthService } from './google/google.service';

@Module({
  controllers: [AuthController],
  providers: [KakakoAuthService, GoogleAuthService],
})
export class AuthModule {}

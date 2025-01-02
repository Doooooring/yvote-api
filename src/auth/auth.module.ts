import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from './admin/admin.guard';
import { AuthController } from './auth.controller';
import { GoogleAuthService } from './google/google.service';
import { KakakoAuthService } from './kakao/kakao.service';
import { AdminAuthService } from './admin/admin.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('YVOTE_JWT_SECRET_KEY'),
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    KakakoAuthService,
    GoogleAuthService,
    AdminAuthService,
    AdminGuard,
  ],
  exports: [AdminGuard, JwtModule],
})
export class AuthModule {}

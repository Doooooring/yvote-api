import { Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin/admin.guard';
import { GoogleAuthService } from './google/google.service';
import { KakakoAuthService } from './kakao/kakao.service';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(KakakoAuthService)
    kakaoAuthService: KakakoAuthService,
    @Inject(GoogleAuthService)
    goolgEAuthService: GoogleAuthService,
  ) {}

  @Post('/kakao/login')
  async kakaoLogin() {}

  @Post('/google/login')
  async googleLogin() {}

  @Post('/apple/login')
  async appleLogin() {}

  @UseGuards(AdminGuard)
  @Get('/admin/validate-session')
  async checkTokenValidation() {
    return true;
  }

  @Post('/admin/refresh')
  async checkTokenRefresh() {}

  @Post('/admin/login')
  async adminLogin() {}

  @Post('/logout')
  async logout() {}
}

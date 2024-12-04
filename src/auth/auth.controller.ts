import { Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { KakakoAuthService } from './kakao/kakao.service';
import { GoogleAuthService } from './google/google.service';
import { Authroziation } from 'src/tools/decorator';
import { AdminGuard } from './admin/admin.guard';

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

  @Post('/admin/login')
  async adminLogin() {}

  @Post('/logout')
  async logout() {}
}

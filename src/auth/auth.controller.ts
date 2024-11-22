import { Controller, Inject, Post } from '@nestjs/common';
import { KakakoAuthService } from './kakao/kakao.service';
import { GoogleAuthService } from './google/google.service';
import { Authroziation } from 'src/tools/decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(KakakoAuthService)
    kakaoAuthService: KakakoAuthService,
    @Inject(GoogleAuthService)
    goolgEAuthService: GoogleAuthService,
  ) {}

  @Post('/kakao/login')
  async kakaoLogin(@Authroziation()) {}

  @Post('/google/login')
  async googleLogin() {}

  @Post('/apple/login')
  async appleLogin() {}

  @Post('/admin/login')
  async adminLogin() {}

  @Post('/logout')
  async logout() {}
}

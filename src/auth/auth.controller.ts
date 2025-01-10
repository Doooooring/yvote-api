import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin/admin.guard';
import { GoogleAuthService } from './google/google.service';
import { KakakoAuthService } from './kakao/kakao.service';
import { AdminAuthService } from './admin/admin.service';
import { Authroziation, RespInterceptor } from 'src/tools/decorator';
import { bearerParse } from 'src/tools/common';
import { Request, Response } from 'express';

@Controller('/auth')
export class AuthController {
  constructor(
    @Inject(KakakoAuthService)
    private kakaoAuthService: KakakoAuthService,
    @Inject(GoogleAuthService)
    private goolgEAuthService: GoogleAuthService,
    @Inject(AdminAuthService)
    private adminAuthService: AdminAuthService,
  ) {}

  @Post('/kakao/login')
  async kakaoLogin() {}

  @Post('/google/login')
  async googleLogin() {}

  @Post('/apple/login')
  async appleLogin() {}

  @UseGuards(AdminGuard)
  @Get('/admin/validate-session')
  @RespInterceptor
  async checkTokenValidation(@Req() req: Request) {
    return true;
  }

  @Post('/admin/refresh')
  async checkTokenRefresh() {}

  @Post('/admin/login')
  async adminLogin(@Body() body, @Res() res: Response) {
    const token = body.token;
    const jwt = await this.adminAuthService.login(token);

    res.cookie('access_token', jwt, {
      maxAge: 1000 * 60 * 60,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });

    return res.send({
      success: true,
      result: {
        message: 'Login successful',
      },
    });
  }

  @Post('/logout')
  async logout() {}
}

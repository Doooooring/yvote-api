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
import { Request, Response } from 'express';
import { RespInterceptor } from 'src/tools/decorator';
import { AdminGuard } from './admin/admin.guard';
import { AdminAuthService } from './admin/admin.service';
import { GoogleAuthService } from './google/google.service';
import { KakakoAuthService } from './kakao/kakao.service';

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

  @UseGuards(AdminGuard)
  @Get('/admin/cookie-info')
  async getCookiePayload(@Req() req: Request) {
    console.log(req.cookies);
    return true;
  }

  @Post('/admin/refresh')
  async checkTokenRefresh() {}

  @Post('/admin/login')
  async adminLogin(@Body() body, @Res() res: Response) {
    const token = body.token;
    const jwt = await this.adminAuthService.login(token);

    res.cookie('access_token', jwt, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'none',
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

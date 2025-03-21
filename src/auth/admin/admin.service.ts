import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthServiceInterface } from '../auth.service.interface';

@Injectable()
export class AdminAuthService extends AuthServiceInterface {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    super();
  }
  async login(token: string) {
    if (token == this.configService.get('YVOTE_ADMIN_CODE')) {
      const payload = { username: 'admin', expiredAt: new Date() };
      const jwt = await this.jwtService.signAsync(payload, {
        expiresIn: `${60 * 60 * 24}s`,
      });
      return jwt;
    }
    throw new UnauthorizedException();
  }

  async getCookieInfo(token: string) {
    const info = await this.jwtService.verifyAsync(token);
    return info;
  }
}

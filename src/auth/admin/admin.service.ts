import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload } from 'src/interface/auth';
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
      const payload = {
        username: 'admin',
        expiredAt: new Date(),
      } as AuthPayload;
      const jwt = await this.jwtService.signAsync(payload, {
        expiresIn: `${60 * 60 * 24}s`,
      });
      return jwt;
    }
    throw new UnauthorizedException();
  }

  async getCookieInfo(accessToken: string) {
    const payload = this.jwtService.decode(accessToken) as AuthPayload;
    return payload;
  }
}

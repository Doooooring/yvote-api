import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthServiceInterface } from '../auth.service.interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

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
      const payload = { username: 'admin' };
      const jwt = await this.jwtService.signAsync(payload, {
        expiresIn: `${31 * 60 * 60}s`,
      });
      return jwt;
    }
    throw new UnauthorizedException();
  }
}

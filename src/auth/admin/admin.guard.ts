import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private configServie: ConfigService,
    private jwtService: JwtService,
  ) {}

  async checkCookieHeader(req: Request) {
    const token = req.cookies?.['access_token'];

    if (!token) {
      throw new Error('TokenNotExist');
    }
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch (e) {
      throw new Error('TokenInvalid');
    }
  }

  async checkAuthToken(req: Request) {
    const token = this.extractTokenFromHeader(req);
    const adminToken = this.configServie.get('YVOTE_ADMIN_TOKEN');

    if (!token) {
      throw new Error('TokenNotExist');
    }

    if (token !== adminToken) {
      throw new Error('TokenInvalid');
    }

    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    await Promise.any([
      this.checkCookieHeader(request),
      Promise.resolve().then(() => this.checkAuthToken(request)),
    ]).catch((error) => {
      throw new Error(error.message);
    });
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

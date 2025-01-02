import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      console.log(request.cookies);
      const token = request.cookies?.['access_token'];

      console.log('=======================');
      console.log(token);

      if (!token) {
        throw new Error('TokenNotExist');
      }

      const payload = await this.jwtService.verifyAsync(token);
      return true;
    } catch (e) {
      throw Error(e);
      return false;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

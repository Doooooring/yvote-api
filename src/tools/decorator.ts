import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { bearerParse } from './common';

export const Authroziation = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authorization = request.headers.authroization;
    const token = bearerParse(authorization);
    return token;
  },
);

export function RespSuccess(target: any, key: string, descriptor: any) {
  return {
    success: true,
    data: target,
  };
}

export function RespFail(target: any, key: string, descriptor: any) {
  return {
    success: false,
    data: target,
  };
}

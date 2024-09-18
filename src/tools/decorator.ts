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

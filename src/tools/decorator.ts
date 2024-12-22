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

export function RespInterceptor(
  target: any,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      const result = await originalMethod.apply(this, args);
      console.log(result);
      return {
        success: true,
        result: result,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        result: error,
      };
    }
  };

  return descriptor;
}

export function RespFail(target: any, key: string, descriptor: any) {
  return {
    success: false,
    result: target,
  };
}

import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { bearerParse } from './common';
import { errLoger } from './logger';

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
      return {
        success: true,
        result: result,
      };
    } catch (error) {
      errLoger({ message: error.message, timestamp: new Date().toISOString() });
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

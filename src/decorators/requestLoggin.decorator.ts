import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { RequestLoggingInterceptor } from 'src/interceptors/requestLogginng.interceptors';

export function LogRequests(): ClassDecorator {
  return applyDecorators(UseInterceptors(RequestLoggingInterceptor));
}

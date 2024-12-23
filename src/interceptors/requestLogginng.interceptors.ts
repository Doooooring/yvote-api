import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';
import { iReqLog, reqLogger } from 'src/tools/logger';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const { method, url, headers, body } = request as {
      method: string;
      url: string;
      headers: any;
      body: any;
    };
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      url,
      headers,
      body,
    };

    reqLogger(logData);

    return next.handle().pipe(tap((data) => {}));
  }
}

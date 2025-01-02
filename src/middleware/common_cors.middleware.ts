import { Injectable, NestMiddleware } from '@nestjs/common';
import * as cors from 'cors';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CommonCorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('설마 여기도 오나?');
    console.log('--- CommonCorsMiddleware 시작 ---');
    console.log(`요청 메소드: ${req.method}`);
    console.log(`요청 경로: ${req.path}`);
    console.log(`Origin 헤더: ${req.headers.origin}`);
    cors({ origin: '*' })(req, res, next);
  }
}

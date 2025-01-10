import { Injectable, NestMiddleware } from '@nestjs/common';
import * as cors from 'cors';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthCorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('--- AuthCorsMiddleware 시작 ---');
    console.log(`요청 메소드: ${req.method}`);
    console.log(`요청 경로: ${req.path}`);
    console.log(`Origin 헤더: ${req.headers.origin}`);
    const corsOptions = {
      origin: [
        'http://localhost:3001',
        'http://localhost:3002',
        'https://yvoting.com',
        'https://y-vote-admin.vercel.app',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    };
    cors(corsOptions)(req, res, (err) => {
      if (err) {
        console.log('*****************');
        console.log(err);
        return res.status(500).json({ message: 'CORS 설정 오류' });
      }
      console.log('AuthCorsMiddleware를 통한 CORS 설정 성공');
      console.log('응답 헤더 (CORS 관련):', res.getHeaders());
      console.log('--- AuthCorsMiddleware 종료 ---\n');
      next();
    });
  }
}

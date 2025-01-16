import { Injectable, NestMiddleware } from '@nestjs/common';
import * as cors from 'cors';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthCorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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
      next();
    });
  }
}

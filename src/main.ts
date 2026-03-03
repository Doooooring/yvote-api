import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorLoggingFilter } from './exceptionFilter/allException.filter';
import * as cookieParser from 'cookie-parser';
import * as express from 'express'; // express 가져오기

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //app.enableCors();
  app.use(cookieParser());
  app.useGlobalFilters(new ErrorLoggingFilter());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  await app.listen(3000);
}
bootstrap();

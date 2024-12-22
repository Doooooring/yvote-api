import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorLoggingFilter } from './exceptionFilter/allException.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new ErrorLoggingFilter());

  await app.listen(3000);
}
bootstrap();

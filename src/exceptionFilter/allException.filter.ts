import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ErrorLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorLoggingFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    console.log(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `Exception occurred:
          Path: ${request.url}
          Method: ${request.method}
          Status: ${status}
          Message: ${
            typeof message === 'string'
              ? message
              : JSON.stringify(message, null, 2)
          }`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error:
        typeof message === 'string' ? message : message['message'] || message,
    });
  }
}

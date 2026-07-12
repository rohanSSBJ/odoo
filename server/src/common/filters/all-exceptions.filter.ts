import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
} from '@prisma/client/runtime/library';

/**
 * Global exception filter. Maps errors to the status codes defined in ARCHITECTURE.md §8:
 *  400 invalid input, 401 unauthenticated, 403 forbidden, 404 not found,
 *  422 business-rule violation, 503 DB unavailable.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message ?? exception.message;
        error = body.error ?? error;
      }
    } else if (
      exception instanceof PrismaClientInitializationError ||
      exception instanceof PrismaClientRustPanicError
    ) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database unavailable';
      error = 'Service Unavailable';
    } else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          const target = (exception.meta?.target as string[])?.join(', ');
          message = `Unique constraint failed${target ? ` on: ${target}` : ''}`;
          error = 'Unprocessable Entity';
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = (exception.meta?.cause as string) ?? 'Record not found';
          error = 'Not Found';
          break;
        case 'P2003':
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          message = 'Related record constraint failed';
          error = 'Unprocessable Entity';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database request error';
          error = 'Bad Request';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        (exception as Error)?.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

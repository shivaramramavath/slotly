// Core implementation for global-exception.filter in server/src/common/filters.
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiErrorResponse } from '@slotly/contracts';
import { ZodError } from 'zod';
import { RevisionConflictException } from '../concurrency/revision.helper';

/** Class implementing global exception filter. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof RevisionConflictException) {
      status = HttpStatus.CONFLICT;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj['message'] as string) || exception.message;
        code = (obj['error'] as string) || `HTTP_${status}`;
        details = obj['details'] || undefined;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Request validation failed';
      details = exception.errors;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error at ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    const payload: ApiErrorResponse = {
      code,
      message: Array.isArray(message) ? message.join(', ') : message,
      ...(details !== undefined ? { details } : {}),
    };

    response.status(status).json(payload);
  }
}

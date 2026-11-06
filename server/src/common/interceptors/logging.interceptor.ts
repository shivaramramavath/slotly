import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
import { RequestWithId } from '../middleware/request-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithId>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, id } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log(
            `[${id || 'no-id'}] ${method} ${url} ${res.statusCode} +${duration}ms`,
          );
        },
        error: (err: Error) => {
          const duration = Date.now() - now;
          this.logger.warn(
            `[${id || 'no-id'}] ${method} ${url} ERROR: ${err.message} +${duration}ms`,
          );
        },
      }),
    );
  }
}

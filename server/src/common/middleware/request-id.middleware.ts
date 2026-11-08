// Core implementation for request-id.middleware in server/src/common/middleware.
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/** Interface defining structure for request with id. */
export interface RequestWithId extends Request {
  id?: string;
}

/** Injectable service providing request id middleware logic. */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const headerId = req.headers['x-request-id'];
    const requestId = typeof headerId === 'string' ? headerId : randomUUID();
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  }
}

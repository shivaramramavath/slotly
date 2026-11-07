// Core implementation for zod-validation.pipe in server/src/common/pipes.
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/** Injectable service providing zod validation pipe logic. */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown): unknown {
    if (!this.schema) return value;
    try {
      return this.schema.parse(value) as unknown;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', '),
          details: error.errors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  if (err.name === 'ZodError' || err instanceof ZodError) {
    const zodError = err as ZodError;
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: null,
      errors: zodError.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if ((err as unknown as { statusCode?: number }).statusCode) {
    const apiErr = err as unknown as {
      statusCode: number;
      message: string;
      errors?: unknown;
    };
    return res.status(apiErr.statusCode).json({
      success: false,
      message: apiErr.message,
      data: null,
      errors: apiErr.errors ?? null,
    });
  }

  if ((err as { code?: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. Resource already exists.',
      data: null,
    });
  }

  logger.error('Unhandled error', err);

  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
    data: null,
  });
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const validate =
  (schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw result.error;
    }
    req[source] = result.data;
    next();
  };

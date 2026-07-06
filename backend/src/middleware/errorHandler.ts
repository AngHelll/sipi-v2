// Global error handling middleware
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

export class AuthenticationError extends Error implements AppError {
  statusCode: number;

  constructor(message: string = 'Invalid credentials') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error implements AppError {
  statusCode: number;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  // Log server-side (stack solo en desarrollo)
  if (isProduction()) {
    console.error('Error:', { statusCode, name: err.name, message: err.message });
  } else {
    console.error('Error:', err);
  }

  // En producción no filtrar mensajes de errores de cliente (4xx) ni de clases AppError
  const exposeMessage =
    !isProduction() ||
    statusCode < 500 ||
    err instanceof AuthenticationError ||
    err instanceof ForbiddenError;

  const message = exposeMessage
    ? err.message || (statusCode < 500 ? 'Request failed' : 'Internal server error')
    : 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(!isProduction() && { stack: err.stack }),
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};


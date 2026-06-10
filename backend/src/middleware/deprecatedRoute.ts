// Responds with 410 Gone for removed/deprecated API routes
import { Request, Response } from 'express';

export interface DeprecatedRouteOptions {
  message: string;
  replacement?: string;
  docs?: string;
}

export const deprecatedRoute =
  (options: DeprecatedRouteOptions) =>
  (_req: Request, res: Response): void => {
    res.status(410).json({
      error: 'Gone',
      message: options.message,
      replacement: options.replacement,
      docs: options.docs,
    });
  };

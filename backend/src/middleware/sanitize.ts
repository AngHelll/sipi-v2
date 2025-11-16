// Input sanitization middleware
import validator from 'validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize string fields in request body
 * Removes HTML tags and trims whitespace
 * Excludes password fields to preserve special characters
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    // Fields to exclude from HTML escaping (passwords, tokens, etc.)
    const excludeFields = ['password', 'passwordHash', 'token', 'refreshToken'];
    
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace
        req.body[key] = req.body[key].trim();
        // Escape HTML to prevent XSS (except for password fields)
        if (!excludeFields.includes(key.toLowerCase())) {
          req.body[key] = validator.escape(req.body[key]);
        }
      }
    });
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = validator.escape(String(req.query[key]).trim());
      }
    });
  }

  next();
};

/**
 * Sanitize specific fields (for cases where we need to preserve HTML or special chars)
 * Only trims whitespace, doesn't escape
 * Safe for passwords and other sensitive fields
 */
export const sanitizeSoft = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Only trim, don't escape (preserves passwords and special chars)
        req.body[key] = req.body[key].trim();
      }
    });
  }

  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = String(req.query[key]).trim();
      }
    });
  }

  next();
};


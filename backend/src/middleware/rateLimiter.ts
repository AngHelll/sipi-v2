// Rate limiting middleware for API protection
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login endpoint
 * Prevents brute force attacks
 * 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: {
    error: 'Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests too
});

/**
 * General API rate limiter
 * More permissive limits for development, stricter for production
 * Development: 500 requests per 15 minutes per IP
 * Production: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // More permissive in development
  message: {
    error: 'Demasiadas solicitudes. Por favor intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour per IP
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests
  message: {
    error: 'Demasiadas solicitudes. Por favor intenta de nuevo en una hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});


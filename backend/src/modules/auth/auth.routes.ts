// Auth routes - Route definitions for authentication endpoints
import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { loginLimiter } from '../../middleware/rateLimiter';
import { sanitizeSoft } from '../../middleware/sanitize';

const router = Router();

/**
 * POST /api/auth/login
 * Public route - Login with username and password
 * Protected with rate limiting to prevent brute force attacks
 */
router.post('/login', loginLimiter, sanitizeSoft, authController.login);

/**
 * POST /api/auth/logout
 * Protected route - Logout current user
 */
router.post('/logout', authenticate, authController.logout);

/**
 * GET /api/auth/me
 * Protected route - Get current authenticated user
 */
router.get('/me', authenticate, authController.getMe);

export default router;


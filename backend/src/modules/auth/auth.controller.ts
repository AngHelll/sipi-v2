// Auth controller - Request/response handling for authentication
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as authService from './auth.service';

/**
 * POST /api/auth/login
 * Authenticate user and set HTTP-only cookie with JWT token
 */
export const login = asyncHandler(async (req, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  // Authenticate user
  const authResult = await authService.login({ username, password });

  // Generate JWT token
  const token = authService.generateToken({
    userId: authResult.user.id,
    username: authResult.user.username,
    role: authResult.user.role,
  });

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    message: 'Login successful',
    user: authResult.user,
  });
});

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
export const logout = asyncHandler(async (req, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

/**
 * GET /api/auth/me
 * Get current authenticated user data
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = await authService.getCurrentUser(req.user.userId);
  res.json({ user });
});


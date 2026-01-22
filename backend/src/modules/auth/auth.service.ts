// Auth service - Business logic for authentication
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { config } from '../../config/env';
import { JwtPayload, UserRole } from '../../types';
import { AuthenticationError } from '../../middleware/errorHandler';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
}

/**
 * Authenticate user with username and password
 * Returns user data if credentials are valid
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const { username, password } = credentials;

  // Find user by username
  const user = await prisma.users.findUnique({
    where: { username },
  });

  if (!user) {
    // Throw authentication error with 401 status code
    throw new AuthenticationError('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValidPassword) {
    // Throw authentication error with 401 status code
    throw new AuthenticationError('Invalid credentials');
  }

  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
    },
  };
};

/**
 * Generate JWT token for authenticated user
 */
export const generateToken = (payload: JwtPayload): string => {
  const secret = config.jwt.secret;
  const expiresIn = config.jwt.expiresIn;
  
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
};

/**
 * Get current user data by ID
 */
export const getCurrentUser = async (userId: string) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};


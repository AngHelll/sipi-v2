// Type definitions for the application
import { Request } from 'express';

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// For backward compatibility
export interface RequestWithUser extends Request {
  user?: JwtPayload;
}


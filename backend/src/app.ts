// Main Express application entry point
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { sanitizeSoft } from './middleware/sanitize';
import authRoutes from './modules/auth/auth.routes';
import studentsRoutes from './modules/students/students.routes';
import teachersRoutes from './modules/teachers/teachers.routes';
import subjectsRoutes from './modules/subjects/subjects.routes';
import groupsRoutes from './modules/groups/groups.routes';
import enrollmentsRoutes from './modules/enrollments/enrollments.routes';
import searchRoutes from './modules/search/search.routes';
import exportRoutes from './modules/export/export.routes';

const app = express();

// Middleware
// CORS configuration - in development, allow any localhost port
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow any localhost port
    if (config.server.nodeEnv === 'development') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // In production, only allow the configured frontend URL
    if (origin === config.cors.frontendUrl) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Input sanitization (soft - only trims, preserves special chars for passwords)
app.use(sanitizeSoft);

// Rate limiting for all API routes (except health check)
app.use('/api', apiLimiter);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;


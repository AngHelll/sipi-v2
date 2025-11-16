// Students routes - Route definitions for student management endpoints
import { Router } from 'express';
import * as studentsController from './students.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest, validateUUID } from '../../middleware/validation';
import { UserRole } from '../../types';

const router = Router();

/**
 * GET /api/students
 * List all students with optional filters and pagination
 * ADMIN only
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  studentsController.getAllStudents
);

/**
 * POST /api/students
 * Create a new student with associated user account
 * ADMIN only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  studentsController.createStudent
);

/**
 * GET /api/students/me
 * Get complete information of the currently authenticated student
 * STUDENT only
 * IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
 */
router.get(
  '/me',
  authenticate,
  authorize(UserRole.STUDENT),
  studentsController.getMe
);

/**
 * PUT /api/students/:id
 * Update student information
 * ADMIN only
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  studentsController.updateStudent
);

/**
 * GET /api/students/:id
 * Get a single student by ID
 * ADMIN only
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  studentsController.getStudentById
);

/**
 * DELETE /api/students/:id
 * Delete a student and associated user account
 * Also deletes all enrollments (cascade)
 * ADMIN only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  studentsController.deleteStudent
);

export default router;


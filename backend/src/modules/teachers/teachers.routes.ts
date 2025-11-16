// Teachers routes - Route definitions for teacher management endpoints
import { Router } from 'express';
import * as teachersController from './teachers.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest, validateUUID } from '../../middleware/validation';
import { UserRole } from '../../types';

const router = Router();

/**
 * GET /api/teachers
 * List all teachers with optional filters and pagination
 * ADMIN only
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  teachersController.getAllTeachers
);

/**
 * POST /api/teachers
 * Create a new teacher with associated user account
 * ADMIN only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  teachersController.createTeacher
);

/**
 * GET /api/teachers/:id
 * Get a single teacher by ID
 * ADMIN only
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  teachersController.getTeacherById
);

/**
 * PUT /api/teachers/:id
 * Update teacher information
 * ADMIN only
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  teachersController.updateTeacher
);

/**
 * DELETE /api/teachers/:id
 * Delete a teacher and associated user account
 * Cannot delete if teacher has groups assigned
 * ADMIN only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  teachersController.deleteTeacher
);

export default router;


// Enrollments routes - Route definitions for enrollment management endpoints
import { Router } from 'express';
import * as enrollmentsController from './enrollments.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest, validateUUID } from '../../middleware/validation';
import { UserRole } from '../../types';

const router = Router();

/**
 * GET /api/enrollments/me
 * Get all enrollments for the current student
 * Only STUDENT role can access this endpoint
 */
router.get(
  '/me',
  authenticate,
  authorize(UserRole.STUDENT),
  enrollmentsController.getEnrollmentsMe
);

/**
 * GET /api/enrollments/group/:groupId
 * Get all enrollments for a specific group
 * TEACHER can only access enrollments for their own groups
 * ADMIN can access enrollments for any group
 */
router.get(
  '/group/:groupId',
  authenticate,
  validateUUID('groupId'),
  validateRequest,
  enrollmentsController.getEnrollmentsByGroup
);

/**
 * POST /api/enrollments
 * Create a new enrollment
 * Only ADMIN can create enrollments
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  enrollmentsController.createEnrollment
);

/**
 * PUT /api/enrollments/:id
 * Update an existing enrollment
 * TEACHER can update calificacion (for their own groups)
 * ADMIN can update all fields
 */
router.put(
  '/:id',
  authenticate,
  validateUUID('id'),
  validateRequest,
  enrollmentsController.updateEnrollment
);

/**
 * DELETE /api/enrollments/:id
 * Delete an enrollment
 * ADMIN only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  enrollmentsController.deleteEnrollment
);

export default router;


// Subjects routes - Route definitions for subject management endpoints
import { Router } from 'express';
import * as subjectsController from './subjects.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest, validateUUID } from '../../middleware/validation';
import { UserRole } from '../../types';

const router = Router();

/**
 * GET /api/subjects
 * List all subjects with optional filters and pagination
 * ADMIN only
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  subjectsController.getAllSubjects
);

/**
 * POST /api/subjects
 * Create a new subject
 * ADMIN only
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  subjectsController.createSubject
);

/**
 * GET /api/subjects/:id
 * Get a single subject by ID
 * ADMIN only
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  subjectsController.getSubjectById
);

/**
 * PUT /api/subjects/:id
 * Update subject information
 * ADMIN only
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  subjectsController.updateSubject
);

/**
 * DELETE /api/subjects/:id
 * Delete a subject
 * Cannot delete if subject has groups
 * ADMIN only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  subjectsController.deleteSubject
);

export default router;


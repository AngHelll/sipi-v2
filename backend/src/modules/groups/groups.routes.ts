// Groups routes - Route definitions for group management endpoints
import { Router } from 'express';
import * as groupsController from './groups.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest, validateUUID } from '../../middleware/validation';
import { UserRole } from '../../types';

const router = Router();

/**
 * GET /api/groups
 * List all groups with optional filters and pagination
 * Role-based access:
 * - ADMIN: sees all groups
 * - TEACHER: sees only groups where teacherId = current user's Teacher record
 * - STUDENT: sees groups where they are enrolled
 */
router.get(
  '/',
  authenticate,
  groupsController.getAllGroups
);

/**
 * GET /api/groups/available/english-courses
 * Get available English courses for students
 * Returns courses that are open, within registration period, and have available capacity
 * IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
 */
router.get(
  '/available/english-courses',
  authenticate,
  // ADMIN también lo usa para asignar grupos desde la lista de espera
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  groupsController.getAvailableEnglishCourses
);

/**
 * GET /api/groups/:id
 * Get a single group by ID
 * All authenticated users can access
 */
router.get(
  '/:id',
  authenticate,
  validateUUID('id'),
  validateRequest,
  groupsController.getGroupById
);

/**
 * POST /api/groups
 * Create a new group
 * Only ADMIN can create groups
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  groupsController.createGroup
);

/**
 * PUT /api/groups/:id
 * Update an existing group
 * Only ADMIN can update groups
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  groupsController.updateGroup
);

/**
 * DELETE /api/groups/:id
 * Soft-delete a group (baja lógica; queda en historial)
 * ADMIN only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  groupsController.deleteGroup
);

/**
 * POST /api/groups/:id/restore
 * Restore a soft-deleted group
 * ADMIN only
 */
router.post(
  '/:id/restore',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  groupsController.restoreGroup
);

export default router;


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
  authorize(UserRole.STUDENT),
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
 * Delete a group and all associated enrollments (cascade)
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

export default router;


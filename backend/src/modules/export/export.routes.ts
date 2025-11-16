// Export routes - Route definitions for export endpoints
import { Router } from 'express';
import * as exportController from './export.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '../../types';

const router = Router();

/**
 * GET /api/export/students
 * Export students to Excel
 * ADMIN only
 */
router.get(
  '/students',
  authenticate,
  authorize(UserRole.ADMIN),
  exportController.exportStudents
);

/**
 * GET /api/export/teachers
 * Export teachers to Excel
 * ADMIN only
 */
router.get(
  '/teachers',
  authenticate,
  authorize(UserRole.ADMIN),
  exportController.exportTeachers
);

/**
 * GET /api/export/subjects
 * Export subjects to Excel
 * ADMIN only
 */
router.get(
  '/subjects',
  authenticate,
  authorize(UserRole.ADMIN),
  exportController.exportSubjects
);

/**
 * GET /api/export/groups
 * Export groups to Excel
 * ADMIN only
 */
router.get(
  '/groups',
  authenticate,
  authorize(UserRole.ADMIN),
  exportController.exportGroups
);

export default router;


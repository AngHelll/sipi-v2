// Export routes - Route definitions for export endpoints
import { Router } from 'express';
import * as exportController from './export.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { strictLimiter } from '../../middleware/rateLimiter';
import { UserRole } from '../../types';

const router = Router();

// Todas las exportaciones son ADMIN-only y descargan PII masiva → límite estricto.
router.use(authenticate, authorize(UserRole.ADMIN), strictLimiter);

/**
 * GET /api/export/students
 * Export students to Excel
 */
router.get('/students', exportController.exportStudents);

/**
 * GET /api/export/teachers
 * Export teachers to Excel
 */
router.get('/teachers', exportController.exportTeachers);

/**
 * GET /api/export/subjects
 * Export subjects to Excel
 */
router.get('/subjects', exportController.exportSubjects);

/**
 * GET /api/export/groups
 * Export groups to Excel
 */
router.get('/groups', exportController.exportGroups);

export default router;


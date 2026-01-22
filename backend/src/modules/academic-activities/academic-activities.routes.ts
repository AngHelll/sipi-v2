// Academic Activities Routes - Route definitions for academic activities endpoints
// V2: Rutas para actividades académicas
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest, validateUUID } from '../../middleware/validation';
import { UserRole } from '../../types';
import * as examsController from './exams/exams.controller';
import * as specialCoursesController from './special-courses/special-courses.controller';
import * as examPeriodsController from './exam-periods/exam-periods.controller';

const router = Router();

/**
 * ============================================
 * Exams Routes
 * ============================================
 */

/**
 * POST /api/academic-activities/exams
 * Create diagnostic exam (Student)
 */
router.post(
  '/exams',
  authenticate,
  authorize(UserRole.STUDENT),
  examsController.createDiagnosticExamHandler
);

/**
 * PUT /api/academic-activities/exams/:id/result
 * Process exam result (Teacher/Admin)
 */
router.put(
  '/exams/:id/result',
  authenticate,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  examsController.processExamResultHandler
);

/**
 * PUT /api/academic-activities/exams/:id/receive-and-approve-payment
 * Receive physical payment proof and approve payment (Admin only)
 */
router.put(
  '/exams/:id/receive-and-approve-payment',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  examsController.receiveAndApproveExamPaymentHandler
);

/**
 * PUT /api/academic-activities/exams/:id/reject-payment
 * Reject payment (Admin only)
 */
router.put(
  '/exams/:id/reject-payment',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  examsController.rejectExamPaymentHandler
);

/**
 * GET /api/academic-activities/exams/student/english-status
 * Get student English status (V2) - includes exams and courses
 * IMPORTANT: This route must be defined BEFORE /exams/student to avoid route conflicts
 */
router.get(
  '/exams/student/english-status',
  authenticate,
  authorize(UserRole.STUDENT),
  examsController.getStudentEnglishStatusV2Handler
);

/**
 * GET /api/academic-activities/exams/student
 * Get exams by student (Student)
 * IMPORTANT: This route must be defined BEFORE /exams/:id to avoid route conflicts
 */
router.get(
  '/exams/student',
  authenticate,
  authorize(UserRole.STUDENT),
  examsController.getExamsByStudentHandler
);

/**
 * GET /api/academic-activities/exams/:id
 * Get exam by ID (Admin only)
 * IMPORTANT: This route must be defined BEFORE /exams to avoid route conflicts
 */
router.get(
  '/exams/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  examsController.getExamByIdHandler
);

/**
 * GET /api/academic-activities/exams
 * Get all exams with filters and pagination (Admin only)
 */
router.get(
  '/exams',
  authenticate,
  authorize(UserRole.ADMIN),
  examsController.getAllExamsHandler
);

/**
 * ============================================
 * Exam Periods Routes
 * ============================================
 */

/**
 * GET /api/academic-activities/exam-periods
 * Get all exam periods (Admin/Teacher)
 */
router.get(
  '/exam-periods',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  examPeriodsController.getAllExamPeriodsHandler
);

/**
 * GET /api/academic-activities/exam-periods/available
 * Get available exam periods (Student)
 */
router.get(
  '/exam-periods/available',
  authenticate,
  authorize(UserRole.STUDENT),
  examPeriodsController.getAvailableExamPeriodsHandler
);

/**
 * GET /api/academic-activities/exam-periods/:id
 * Get exam period by ID (Admin/Teacher)
 */
router.get(
  '/exam-periods/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  validateUUID('id'),
  examPeriodsController.getExamPeriodByIdHandler
);

/**
 * POST /api/academic-activities/exam-periods
 * Create exam period (Admin only)
 */
router.post(
  '/exam-periods',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest,
  examPeriodsController.createExamPeriodHandler
);

/**
 * PUT /api/academic-activities/exam-periods/:id
 * Update exam period (Admin only)
 */
router.put(
  '/exam-periods/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  examPeriodsController.updateExamPeriodHandler
);

/**
 * PUT /api/academic-activities/exam-periods/:id/open
 * Open exam period (Admin only)
 */
router.put(
  '/exam-periods/:id/open',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  examPeriodsController.openExamPeriodHandler
);

/**
 * PUT /api/academic-activities/exam-periods/:id/close
 * Close exam period (Admin only)
 */
router.put(
  '/exam-periods/:id/close',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  examPeriodsController.closeExamPeriodHandler
);

/**
 * ============================================
 * Special Courses Routes
 * ============================================
 */

/**
 * GET /api/academic-activities/special-courses
 * Get all special courses (Admin only)
 */
router.get(
  '/special-courses',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest,
  specialCoursesController.getAllSpecialCoursesHandler
);

/**
 * GET /api/academic-activities/special-courses/:id
 * Get special course by ID (Admin only)
 */
router.get(
  '/special-courses/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  specialCoursesController.getSpecialCourseByIdHandler
);

/**
 * POST /api/academic-activities/special-courses
 * Create special course enrollment (Student)
 */
router.post(
  '/special-courses',
  authenticate,
  authorize(UserRole.STUDENT),
  specialCoursesController.createSpecialCourseHandler
);

/**
 * PUT /api/academic-activities/special-courses/:id/receive-and-approve-payment
 * Receive physical payment proof and approve payment (Admin only)
 */
router.put(
  '/special-courses/:id/receive-and-approve-payment',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  specialCoursesController.receiveAndApprovePaymentHandler
);

/**
 * PUT /api/academic-activities/special-courses/:id/reject-payment
 * Reject payment (Admin only)
 */
router.put(
  '/special-courses/:id/reject-payment',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  specialCoursesController.rejectPaymentHandler
);

/**
 * PUT /api/academic-activities/special-courses/:id/complete
 * Complete special course (Teacher/Admin)
 */
router.put(
  '/special-courses/:id/complete',
  authenticate,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  specialCoursesController.completeSpecialCourseHandler
);

export default router;


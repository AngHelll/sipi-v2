// Enrollments routes - Route definitions for enrollment management endpoints
import { Router } from 'express';
import * as enrollmentsController from './enrollments.controller';
import * as englishEnrollmentsController from './english/english-enrollments.controller';
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
 * GET /api/enrollments
 * Get all enrollments with filters and pagination
 * ADMIN only
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  enrollmentsController.getAllEnrollments
);

/**
 * GET /api/enrollments/:id
 * Get a specific enrollment by ID
 * ADMIN can access any enrollment
 * TEACHER can only access enrollments for their own groups
 * STUDENT can only access their own enrollments
 */
router.get(
  '/:id',
  authenticate,
  validateUUID('id'),
  validateRequest,
  enrollmentsController.getEnrollmentById
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

/**
 * ============================================
 * RB-038: English Enrollments Routes
 * ============================================
 */

/**
 * POST /api/enrollments/english/exam
 * Request diagnostic exam enrollment (Student)
 */
router.post(
  '/english/exam',
  authenticate,
  authorize(UserRole.STUDENT),
  englishEnrollmentsController.requestDiagnosticExamHandler
);

/**
 * POST /api/enrollments/english/course
 * Request English course enrollment (Student)
 */
router.post(
  '/english/course',
  authenticate,
  authorize(UserRole.STUDENT),
  englishEnrollmentsController.requestEnglishCourseHandler
);

/**
 * POST /api/enrollments/english/:id/payment
 * Submit payment proof (Student)
 */
router.post(
  '/english/:id/payment',
  authenticate,
  authorize(UserRole.STUDENT),
  validateUUID('id'),
  validateRequest,
  englishEnrollmentsController.submitPaymentProofHandler
);

/**
 * PUT /api/enrollments/english/:id/approve-payment
 * Approve payment (Admin only)
 */
router.put(
  '/english/:id/approve-payment',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  englishEnrollmentsController.approvePaymentHandler
);

/**
 * PUT /api/enrollments/english/:id/reject-payment
 * Reject payment (Admin only)
 */
router.put(
  '/english/:id/reject-payment',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  englishEnrollmentsController.rejectPaymentHandler
);

/**
 * PUT /api/enrollments/english/:id/exam-result
 * Process diagnostic exam result (Teacher/Admin)
 */
router.put(
  '/english/:id/exam-result',
  authenticate,
  validateUUID('id'),
  validateRequest,
  englishEnrollmentsController.processDiagnosticExamResultHandler
);

/**
 * PUT /api/enrollments/english/:id/course-completion
 * Process English course completion (Teacher/Admin)
 */
router.put(
  '/english/:id/course-completion',
  authenticate,
  validateUUID('id'),
  validateRequest,
  englishEnrollmentsController.processEnglishCourseCompletionHandler
);

/**
 * GET /api/enrollments/english/student-status
 * Get student English status (Student)
 */
router.get(
  '/english/student-status',
  authenticate,
  authorize(UserRole.STUDENT),
  englishEnrollmentsController.getStudentEnglishStatusHandler
);

/**
 * GET /api/enrollments/english/pending-approvals
 * Get pending payment approvals (Admin only)
 */
router.get(
  '/english/pending-approvals',
  authenticate,
  authorize(UserRole.ADMIN),
  englishEnrollmentsController.getPendingPaymentApprovalsHandler
);

export default router;


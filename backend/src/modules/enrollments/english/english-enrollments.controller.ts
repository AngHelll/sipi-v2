// English enrollments controller - HTTP request handlers for English enrollments
// RB-038: Controller específico para inscripciones de inglés
import { Request, Response } from 'express';
import {
  requestDiagnosticExam,
  requestEnglishCourse,
  submitPaymentProof,
  approvePayment,
  rejectPayment,
  processDiagnosticExamResult,
  processEnglishCourseCompletion,
  getStudentEnglishStatus,
  getPendingPaymentApprovals,
} from './english-enrollments.service';

/**
 * POST /api/enrollments/english/exam
 * Request diagnostic exam enrollment (Student)
 */
export const requestDiagnosticExamHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is authenticated
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user has STUDENT role (additional check beyond middleware)
    if (userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can request diagnostic exams' });
      return;
    }

    if (!groupId) {
      res.status(400).json({ error: 'groupId is required' });
      return;
    }

    // Get student ID from user - verify student exists and belongs to this user
    const prisma = require('../../../config/database').default;
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found. This user is not associated with a student record.' });
      return;
    }

    const enrollment = await requestDiagnosticExam(student.id, groupId);

    res.status(201).json({
      message: 'Examen de diagnóstico solicitado exitosamente',
      enrollment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * POST /api/enrollments/english/course
 * Request English course enrollment (Student)
 */
export const requestEnglishCourseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId, nivelIngles } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is authenticated
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user has STUDENT role (additional check beyond middleware)
    if (userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can request English courses' });
      return;
    }

    if (!groupId || !nivelIngles) {
      res.status(400).json({ error: 'groupId and nivelIngles are required' });
      return;
    }

    if (nivelIngles < 1 || nivelIngles > 6) {
      res.status(400).json({ error: 'nivelIngles must be between 1 and 6' });
      return;
    }

    // Get student ID from user - verify student exists and belongs to this user
    const prisma = require('../../../config/database').default;
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found. This user is not associated with a student record.' });
      return;
    }

    const enrollment = await requestEnglishCourse(student.id, groupId, nivelIngles);

    res.status(201).json({
      message: 'Curso de inglés solicitado exitosamente. Debes realizar el pago para completar la inscripción.',
      enrollment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * POST /api/enrollments/english/:id/payment
 * Submit payment proof (Student)
 */
export const submitPaymentProofHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { montoPago, comprobantePago } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is authenticated
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user has STUDENT role (additional check beyond middleware)
    if (userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can submit payment proofs' });
      return;
    }

    if (!montoPago || !comprobantePago) {
      res.status(400).json({ error: 'montoPago and comprobantePago are required' });
      return;
    }

    const prisma = require('../../../config/database').default;

    // Get student record for this user
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found. This user is not associated with a student record.' });
      return;
    }

    // Verify enrollment exists and belongs to this student
    const enrollment = await prisma.enrollments.findUnique({
      where: { id },
      include: { students: true },
    });

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    // Security check: ensure enrollment belongs to the authenticated student
    if (enrollment.studentId !== student.id) {
      res.status(403).json({ error: 'You can only submit payment for your own enrollments' });
      return;
    }

    const updatedEnrollment = await submitPaymentProof(id, montoPago, comprobantePago);

    res.status(200).json({
      message: 'Comprobante de pago enviado exitosamente. Esperando aprobación del administrador.',
      enrollment: updatedEnrollment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/enrollments/english/:id/approve-payment
 * Approve payment (Admin only)
 */
export const approvePaymentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user is admin
    const user = await require('../../../config/database').default.users.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can approve payments' });
      return;
    }

    const enrollment = await approvePayment(id, userId);

    res.status(200).json({
      message: 'Pago aprobado exitosamente. La inscripción está activa.',
      enrollment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/enrollments/english/:id/reject-payment
 * Reject payment (Admin only)
 */
export const rejectPaymentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { motivo } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user is admin
    const user = await require('../../../config/database').default.users.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can reject payments' });
      return;
    }

    const enrollment = await rejectPayment(id, userId, motivo);

    res.status(200).json({
      message: 'Pago rechazado',
      enrollment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/enrollments/english/:id/exam-result
 * Process diagnostic exam result (Teacher/Admin)
 */
export const processDiagnosticExamResultHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { examGrade } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user is teacher or admin
    const user = await require('../../../config/database').default.users.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      res.status(403).json({ error: 'Only teachers and admins can process exam results' });
      return;
    }

    if (!examGrade || examGrade < 0 || examGrade > 100) {
      res.status(400).json({ error: 'examGrade must be between 0 and 100' });
      return;
    }

    const enrollment = await processDiagnosticExamResult(id, examGrade);

    res.status(200).json({
      message: 'Resultado del examen de diagnóstico procesado exitosamente',
      enrollment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/enrollments/english/:id/course-completion
 * Process English course completion (Teacher/Admin)
 */
export const processEnglishCourseCompletionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { finalGrade } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user is teacher or admin
    const user = await require('../../../config/database').default.users.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      res.status(403).json({ error: 'Only teachers and admins can process course completion' });
      return;
    }

    if (!finalGrade || finalGrade < 0 || finalGrade > 100) {
      res.status(400).json({ error: 'finalGrade must be between 0 and 100' });
      return;
    }

    const enrollment = await processEnglishCourseCompletion(id, finalGrade);

    res.status(200).json({
      message: 'Curso de inglés completado exitosamente',
      enrollment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/enrollments/english/student-status
 * Get student English status (Student)
 */
export const getStudentEnglishStatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is authenticated
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user has STUDENT role (additional check beyond middleware)
    if (userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can view their English status' });
      return;
    }

    // Get student ID from user - verify student exists and belongs to this user
    const prisma = require('../../../config/database').default;
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found. This user is not associated with a student record.' });
      return;
    }

    const status = await getStudentEnglishStatus(student.id);

    res.status(200).json(status);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/enrollments/english/pending-approvals
 * Get pending payment approvals (Admin only)
 */
export const getPendingPaymentApprovalsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify user is admin
    const user = await require('../../../config/database').default.users.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can view pending approvals' });
      return;
    }

    const result = await getPendingPaymentApprovals();

    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};


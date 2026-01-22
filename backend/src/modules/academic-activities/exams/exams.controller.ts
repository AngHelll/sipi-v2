// Exams Controller - HTTP request handlers for exams
// V2: Controller para exámenes (NO requiere grupo)
import { Request, Response } from 'express';
import {
  createDiagnosticExam,
  processExamResult,
  getExamsByStudent,
  getAllExams,
  getExamById,
  getStudentEnglishStatusV2,
  receiveAndApproveExamPayment,
  rejectExamPayment,
} from './exams.service';

/**
 * POST /api/academic-activities/exams
 * Create diagnostic exam (Student)
 */
export const createDiagnosticExamHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examType, subjectId, nivelIngles, periodId } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is authenticated and is student
    if (!userId || userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can request diagnostic exams' });
      return;
    }

    if (!examType) {
      res.status(400).json({ error: 'examType is required' });
      return;
    }

    if (!['DIAGNOSTICO', 'ADMISION', 'CERTIFICACION'].includes(examType)) {
      res.status(400).json({ error: 'Invalid examType. Must be DIAGNOSTICO, ADMISION, or CERTIFICACION' });
      return;
    }

    // Get student ID from user
    const prisma = require('../../../config/database').default;
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const result = await createDiagnosticExam(
      student.id,
      examType,
      subjectId,
      nivelIngles,
      periodId
    );

    res.status(201).json({
      message: 'Examen de diagnóstico solicitado exitosamente',
      activity: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/exams/:id/result
 * Process exam result (Teacher/Admin)
 */
export const processExamResultHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resultado, nivelIngles, calificacionesPorNivel } = req.body;
    const userId = req.user?.userId;

    if (!resultado || resultado < 0 || resultado > 100) {
      res.status(400).json({ error: 'resultado must be between 0 and 100' });
      return;
    }

    // Validate nivelIngles if provided
    // Special case: nivelIngles can be 0 if resultado >= 70 (allows student to take level 6 as real course)
    if (nivelIngles !== undefined && nivelIngles !== null) {
      if (nivelIngles < 0 || nivelIngles > 6) {
        res.status(400).json({ error: 'nivelIngles must be between 0 and 6 (0 allows student to take level 6 as real course)' });
        return;
      }
      
      if (nivelIngles === 0 && resultado < 70) {
        res.status(400).json({ error: 'Solo puedes usar nivel 0 si la calificación es >= 70' });
        return;
      }
      
      // Validate calificacionesPorNivel if provided and nivelIngles > 0
      if (nivelIngles > 0 && calificacionesPorNivel && typeof calificacionesPorNivel === 'object') {
        for (let nivel = 1; nivel < nivelIngles; nivel++) {
          const calificacion = calificacionesPorNivel[nivel];
          if (calificacion === undefined || calificacion === null) {
            res.status(400).json({ error: `Calificación requerida para el nivel ${nivel}` });
            return;
          }
          if (calificacion < 0 || calificacion > 100) {
            res.status(400).json({ error: `La calificación del nivel ${nivel} debe estar entre 0 y 100` });
            return;
          }
        }
      }
    }

    const result = await processExamResult(id, resultado, userId, nivelIngles, calificacionesPorNivel);

    res.status(200).json({
      message: result.message || 'Resultado del examen procesado exitosamente',
      result: {
        activityId: result.activityId,
        resultado: result.resultado,
        estatus: result.estatus,
        nivelIngles: result.nivelIngles,
        isPerfectScore: result.isPerfectScore,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/exams/student/english-status
 * Get student English status (V2) - includes exams and courses
 */
export const getStudentEnglishStatusV2Handler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can view their English status' });
      return;
    }

    const prisma = require('../../../config/database').default;
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const status = await getStudentEnglishStatusV2(student.id);
    res.status(200).json(status);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/exams/student
 * Get exams by student (Student)
 */
export const getExamsByStudentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is authenticated and is student
    if (!userId || userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can view their exams' });
      return;
    }

    // Get student ID from user
    const prisma = require('../../../config/database').default;
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const result = await getExamsByStudent(student.id);

    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/exams/:id
 * Get exam by ID (Admin only)
 */
export const getExamByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exam = await getExamById(id);

    if (!exam) {
      res.status(404).json({ error: 'Examen no encontrado' });
      return;
    }

    res.status(200).json(exam);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/exams
 * Get all exams with filters and pagination (Admin only)
 */
export const getAllExamsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: any = {
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
      sortBy: (req.query.sortBy as 'fechaInscripcion' | 'estatus' | 'examType') || 'fechaInscripcion',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    if (req.query.studentId) {
      query.studentId = String(req.query.studentId);
    }
    if (req.query.periodId) {
      query.periodId = String(req.query.periodId);
    }
    if (req.query.examType) {
      query.examType = String(req.query.examType);
    }
    if (req.query.estatus) {
      query.estatus = String(req.query.estatus);
    }
    if (req.query.fechaInicio) {
      query.fechaInicio = String(req.query.fechaInicio);
    }
    if (req.query.fechaFin) {
      query.fechaFin = String(req.query.fechaFin);
    }

    const result = await getAllExams(query);

    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/exams/:id/receive-and-approve-payment
 * Receive physical payment proof and approve payment (Admin only)
 */
export const receiveAndApproveExamPaymentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { montoPago, observaciones } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can receive and approve payments' });
      return;
    }

    if (!montoPago || montoPago <= 0) {
      res.status(400).json({ error: 'montoPago is required and must be greater than 0' });
      return;
    }

    const result = await receiveAndApproveExamPayment(id, montoPago, observaciones, userId);

    res.status(200).json({
      message: 'Comprobante físico recibido y pago aprobado exitosamente. El estudiante puede presentar el examen.',
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/exams/:id/reject-payment
 * Reject payment (Admin only)
 */
export const rejectExamPaymentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can reject payments' });
      return;
    }

    if (!motivo) {
      res.status(400).json({ error: 'motivo is required' });
      return;
    }

    const result = await rejectExamPayment(id, motivo, userId);

    res.status(200).json({
      message: 'Pago rechazado',
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};


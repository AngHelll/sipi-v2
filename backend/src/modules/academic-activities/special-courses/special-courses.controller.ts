// Special Courses Controller - HTTP request handlers for special courses
// V2: Controller para cursos especiales
import { Request, Response } from 'express';
import {
  createSpecialCourse,
  receiveAndApprovePayment,
  rejectPayment,
  completeSpecialCourse,
  getAllSpecialCourses,
  getSpecialCourseById,
  assignGroupToCourse,
  getWaitlistSummary,
  registerInitialEnglishLevel,
} from './special-courses.service';
import { cancelActivity } from '../academic-activities.service';

/**
 * POST /api/academic-activities/special-courses
 * Create special course enrollment (Student)
 */
export const createSpecialCourseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // requierePago NO se acepta del cliente: la política de pago la decide el servidor
    const { courseType, nivelIngles, groupId } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is authenticated and is student
    if (!userId || userRole !== 'STUDENT') {
      res.status(403).json({ error: 'Only students can request special courses' });
      return;
    }

    if (!courseType) {
      res.status(400).json({ error: 'courseType is required' });
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

    const result = await createSpecialCourse(
      student.id,
      courseType,
      nivelIngles,
      groupId
    );

    res.status(201).json({
      message: result.estatus === 'LISTA_ESPERA'
        ? 'Solicitud agregada a la lista de espera. Te notificaremos cuando se abra un grupo para tu nivel.'
        : 'Curso especial solicitado exitosamente',
      activity: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/special-courses/:id/receive-and-approve-payment
 * Receive physical payment proof and approve payment (Admin only)
 */
export const receiveAndApprovePaymentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { montoPago, observaciones, fechaInicio } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is admin
    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can receive and approve payments' });
      return;
    }

    if (!montoPago || montoPago <= 0) {
      res.status(400).json({ error: 'montoPago is required and must be greater than 0' });
      return;
    }

    const result = await receiveAndApprovePayment(id, montoPago, observaciones, userId, fechaInicio);

    res.status(200).json({
      message: 'Comprobante físico recibido y pago aprobado exitosamente. El estudiante está inscrito y puede asistir al curso.',
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/special-courses/:id/reject-payment
 * Reject payment (Admin only)
 */
export const rejectPaymentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { motivo } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user is admin
    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can reject payments' });
      return;
    }

    if (!motivo) {
      res.status(400).json({ error: 'motivo is required' });
      return;
    }

    const result = await rejectPayment(id, motivo, userId);

    res.status(200).json({
      message: 'Pago rechazado',
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/special-courses/:id/complete
 * Complete special course (Teacher/Admin)
 */
export const completeSpecialCourseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { calificacion } = req.body;
    const userId = req.user?.userId;

    if (!calificacion || calificacion < 0 || calificacion > 100) {
      res.status(400).json({ error: 'calificacion must be between 0 and 100' });
      return;
    }

    const result = await completeSpecialCourse(id, calificacion, userId);

    res.status(200).json({
      message: 'Curso completado exitosamente',
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/special-courses
 * Get all special courses (Admin only)
 */
export const getAllSpecialCoursesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can view all special courses' });
      return;
    }

    const query = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      studentId: req.query.studentId as string | undefined,
      courseType: req.query.courseType as string | undefined,
      nivelIngles: req.query.nivelIngles ? parseInt(req.query.nivelIngles as string, 10) : undefined,
      estatus: req.query.estatus as string | undefined,
      requierePago: req.query.requierePago === 'true' ? true : req.query.requierePago === 'false' ? false : undefined,
      fechaInicio: req.query.fechaInicio as string | undefined,
      fechaFin: req.query.fechaFin as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await getAllSpecialCourses(query);

    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/special-courses/:id
 * Get special course by ID (Admin only)
 */
export const getSpecialCourseByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can view special course details' });
      return;
    }

    const course = await getSpecialCourseById(id);

    if (!course) {
      res.status(404).json({ error: 'Curso especial no encontrado' });
      return;
    }

    res.status(200).json(course);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/special-courses/waitlist/summary
 * Waitlist demand by course type and level (Admin only)
 */
export const getWaitlistSummaryHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can view the waitlist' });
      return;
    }

    const result = await getWaitlistSummary();
    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/special-courses/:id/assign-group
 * Assign a group to a waitlisted course (Admin only)
 */
export const assignGroupHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { groupId, requierePago } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can assign groups' });
      return;
    }

    if (!groupId) {
      res.status(400).json({ error: 'groupId is required' });
      return;
    }

    const result = await assignGroupToCourse(
      id,
      groupId,
      requierePago !== undefined ? !!requierePago : true,
      userId
    );

    res.status(200).json({
      message: result.requierePago
        ? 'Grupo asignado. El alumno debe realizar el pago para completar la inscripción.'
        : 'Grupo asignado. El alumno quedó inscrito.',
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/special-courses/:id/cancel
 * Cancel a special course request (Student: own only / Admin: any with motivo)
 */
export const cancelSpecialCourseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { motivo } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || (userRole !== 'STUDENT' && userRole !== 'ADMIN')) {
      res.status(403).json({ error: 'Not authorized to cancel' });
      return;
    }

    let studentId: string | undefined;
    if (userRole === 'STUDENT') {
      const prisma = require('../../../config/database').default;
      const student = await prisma.students.findUnique({ where: { userId } });
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }
      studentId = student.id;
    }

    const result = await cancelActivity(id, {
      cancelledBy: userId,
      role: userRole as 'STUDENT' | 'ADMIN',
      studentId,
      motivo,
    });

    res.status(200).json({
      message: 'Solicitud cancelada exitosamente',
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * POST /api/academic-activities/special-courses/initial-level
 * Register initial English level via equivalencia (Admin only)
 */
export const registerInitialLevelHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, nivel, calificacion, calificacionesPorNivel } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can register initial English level' });
      return;
    }

    if (!studentId || !nivel || calificacion === undefined) {
      res.status(400).json({ error: 'studentId, nivel y calificacion son requeridos' });
      return;
    }

    const result = await registerInitialEnglishLevel(
      studentId,
      Number(nivel),
      Number(calificacion),
      calificacionesPorNivel,
      userId
    );

    res.status(200).json({
      message: `Nivel inicial de inglés registrado: nivel ${result.nivelInglesActual}`,
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};


// Exam Periods Controller - HTTP request handlers for exam periods
import { Request, Response } from 'express';
import {
  getAllExamPeriods,
  getExamPeriodById,
  createExamPeriod,
  updateExamPeriod,
  openExamPeriod,
  closeExamPeriod,
  getAvailableExamPeriods,
} from './exam-periods.service';
import {
  CreateExamPeriodDto,
  UpdateExamPeriodDto,
  ExamPeriodQueryDto,
} from './exam-periods.dtos';

/**
 * GET /api/academic-activities/exam-periods
 * Get all exam periods (Admin/Teacher)
 */
export const getAllExamPeriodsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as unknown as ExamPeriodQueryDto;
    const result = await getAllExamPeriods(query);

    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/exam-periods/available
 * Get available exam periods (Student)
 */
export const getAvailableExamPeriodsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const periods = await getAvailableExamPeriods();

    res.status(200).json({
      periods,
      total: periods.length,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/academic-activities/exam-periods/:id
 * Get a single exam period by ID
 */
export const getExamPeriodByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const period = await getExamPeriodById(id);

    if (!period) {
      res.status(404).json({ error: 'Exam period not found' });
      return;
    }

    res.status(200).json(period);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * POST /api/academic-activities/exam-periods
 * Create a new exam period (Admin only)
 */
export const createExamPeriodHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as CreateExamPeriodDto;
    const userId = req.user?.userId;

    if (!data.nombre || !data.fechaInicio || !data.fechaFin || 
        !data.fechaInscripcionInicio || !data.fechaInscripcionFin) {
      res.status(400).json({ 
        error: 'Missing required fields: nombre, fechaInicio, fechaFin, fechaInscripcionInicio, fechaInscripcionFin' 
      });
      return;
    }

    const period = await createExamPeriod(data, userId);

    res.status(201).json({
      message: 'Período de exámenes creado exitosamente',
      period,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/exam-periods/:id
 * Update an exam period (Admin only)
 */
export const updateExamPeriodHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const data = req.body as UpdateExamPeriodDto;
    const userId = req.user?.userId;

    const period = await updateExamPeriod(id, data, userId);

    res.status(200).json({
      message: 'Período de exámenes actualizado exitosamente',
      period,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Exam period not found') {
      res.status(404).json({ error: errorMessage });
      return;
    }
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/exam-periods/:id/open
 * Open exam period (Admin only)
 */
export const openExamPeriodHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    const period = await openExamPeriod(id, userId);

    res.status(200).json({
      message: 'Período de exámenes abierto exitosamente',
      period,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Exam period not found') {
      res.status(404).json({ error: errorMessage });
      return;
    }
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * PUT /api/academic-activities/exam-periods/:id/close
 * Close exam period (Admin only)
 */
export const closeExamPeriodHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    const period = await closeExamPeriod(id, userId);

    res.status(200).json({
      message: 'Período de exámenes cerrado exitosamente',
      period,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Exam period not found') {
      res.status(404).json({ error: errorMessage });
      return;
    }
    res.status(400).json({ error: errorMessage });
  }
};



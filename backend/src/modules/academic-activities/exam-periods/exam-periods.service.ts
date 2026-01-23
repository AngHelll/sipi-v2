// Exam Periods Service - Business logic for diagnostic exam periods
import { randomUUID } from 'node:crypto';
import prisma from '../../../config/database';
import {
  CreateExamPeriodDto,
  UpdateExamPeriodDto,
  ExamPeriodQueryDto,
  ExamPeriodResponseDto,
  ExamPeriodsListResponseDto,
  AvailableExamPeriodResponseDto,
} from './exam-periods.dtos';
import { ExamPeriodsValidators } from './exam-periods.validators';

/**
 * Get all exam periods with optional filters and pagination
 */
export const getAllExamPeriods = async (
  query: ExamPeriodQueryDto
): Promise<ExamPeriodsListResponseDto> => {
  const {
    estatus,
    page = 1,
    limit = 20,
    sortBy = 'fechaInscripcionInicio',
    sortOrder = 'desc',
  } = query;

  // Build where clause
  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (estatus) {
    where.estatus = estatus;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Build orderBy clause
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortOrder;

  // Get total count
  const total = await (prisma as any).diagnostic_exam_periods.count({ where });

  // Get periods
  const periods = await (prisma as any).diagnostic_exam_periods.findMany({
    where,
    skip,
    take,
    orderBy,
  });

  return {
    periods: periods.map((period: any) => ({
      id: period.id,
      nombre: period.nombre,
      descripcion: period.descripcion || undefined,
      fechaInicio: period.fechaInicio.toISOString(),
      fechaFin: period.fechaFin.toISOString(),
      fechaInscripcionInicio: period.fechaInscripcionInicio.toISOString(),
      fechaInscripcionFin: period.fechaInscripcionFin.toISOString(),
      cupoMaximo: period.cupoMaximo,
      cupoActual: period.cupoActual,
      estatus: period.estatus,
      requierePago: period.requierePago,
      montoPago: period.montoPago ? Number(period.montoPago) : undefined,
      observaciones: period.observaciones || undefined,
      createdAt: period.createdAt.toISOString(),
      updatedAt: period.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Get a single exam period by ID
 */
export const getExamPeriodById = async (id: string): Promise<ExamPeriodResponseDto | null> => {
  const period = await (prisma as any).diagnostic_exam_periods.findUnique({
    where: { id },
  });

  if (!period || period.deletedAt) {
    return null;
  }

  return {
    id: period.id,
    nombre: period.nombre,
    descripcion: period.descripcion || undefined,
    fechaInicio: period.fechaInicio.toISOString(),
    fechaFin: period.fechaFin.toISOString(),
    fechaInscripcionInicio: period.fechaInscripcionInicio.toISOString(),
    fechaInscripcionFin: period.fechaInscripcionFin.toISOString(),
    cupoMaximo: period.cupoMaximo,
    cupoActual: period.cupoActual,
    estatus: period.estatus,
    requierePago: period.requierePago,
    montoPago: period.montoPago ? Number(period.montoPago) : undefined,
    observaciones: period.observaciones || undefined,
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
  };
};

/**
 * Create a new exam period
 */
export const createExamPeriod = async (
  data: CreateExamPeriodDto,
  createdBy?: string
): Promise<ExamPeriodResponseDto> => {
  // Validate dates
  ExamPeriodsValidators.validateDates(
    data.fechaInicio,
    data.fechaFin,
    data.fechaInscripcionInicio,
    data.fechaInscripcionFin
  );

  const periodId = randomUUID();
  const now = new Date();

  const period = await (prisma as any).diagnostic_exam_periods.create({
    data: {
      id: periodId,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      fechaInscripcionInicio: new Date(data.fechaInscripcionInicio),
      fechaInscripcionFin: new Date(data.fechaInscripcionFin),
      cupoMaximo: data.cupoMaximo || 100,
      cupoActual: 0,
      estatus: 'PLANEADO',
      requierePago: data.requierePago || false,
      montoPago: data.montoPago || null,
      observaciones: data.observaciones || null,
      createdAt: now,
      updatedAt: now,
      createdBy: createdBy || null,
    },
  });

  return {
    id: period.id,
    nombre: period.nombre,
    descripcion: period.descripcion || undefined,
    fechaInicio: period.fechaInicio.toISOString(),
    fechaFin: period.fechaFin.toISOString(),
    fechaInscripcionInicio: period.fechaInscripcionInicio.toISOString(),
    fechaInscripcionFin: period.fechaInscripcionFin.toISOString(),
    cupoMaximo: period.cupoMaximo,
    cupoActual: period.cupoActual,
    estatus: period.estatus,
    requierePago: period.requierePago,
    montoPago: period.montoPago ? Number(period.montoPago) : undefined,
    observaciones: period.observaciones || undefined,
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
  };
};

/**
 * Update an existing exam period
 */
export const updateExamPeriod = async (
  id: string,
  data: UpdateExamPeriodDto,
  updatedBy?: string
): Promise<ExamPeriodResponseDto> => {
  // Check if period exists
  const existingPeriod = await (prisma as any).diagnostic_exam_periods.findUnique({
    where: { id },
  });

  if (!existingPeriod || existingPeriod.deletedAt) {
    throw new Error('Exam period not found');
  }

  // Validate dates if provided
  if (data.fechaInicio || data.fechaFin || data.fechaInscripcionInicio || data.fechaInscripcionFin) {
    ExamPeriodsValidators.validateDates(
      data.fechaInicio || existingPeriod.fechaInicio.toISOString(),
      data.fechaFin || existingPeriod.fechaFin.toISOString(),
      data.fechaInscripcionInicio || existingPeriod.fechaInscripcionInicio.toISOString(),
      data.fechaInscripcionFin || existingPeriod.fechaInscripcionFin.toISOString()
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null;
  if (data.fechaInicio !== undefined) updateData.fechaInicio = new Date(data.fechaInicio);
  if (data.fechaFin !== undefined) updateData.fechaFin = new Date(data.fechaFin);
  if (data.fechaInscripcionInicio !== undefined) {
    updateData.fechaInscripcionInicio = new Date(data.fechaInscripcionInicio);
  }
  if (data.fechaInscripcionFin !== undefined) {
    updateData.fechaInscripcionFin = new Date(data.fechaInscripcionFin);
  }
  if (data.cupoMaximo !== undefined) updateData.cupoMaximo = data.cupoMaximo;
  if (data.estatus !== undefined) updateData.estatus = data.estatus;
  if (data.requierePago !== undefined) updateData.requierePago = data.requierePago;
  if (data.montoPago !== undefined) updateData.montoPago = data.montoPago || null;
  if (data.observaciones !== undefined) updateData.observaciones = data.observaciones || null;
  if (updatedBy) updateData.updatedBy = updatedBy;

  const period = await (prisma as any).diagnostic_exam_periods.update({
    where: { id },
    data: updateData,
  });

  return {
    id: period.id,
    nombre: period.nombre,
    descripcion: period.descripcion || undefined,
    fechaInicio: period.fechaInicio.toISOString(),
    fechaFin: period.fechaFin.toISOString(),
    fechaInscripcionInicio: period.fechaInscripcionInicio.toISOString(),
    fechaInscripcionFin: period.fechaInscripcionFin.toISOString(),
    cupoMaximo: period.cupoMaximo,
    cupoActual: period.cupoActual,
    estatus: period.estatus,
    requierePago: period.requierePago,
    montoPago: period.montoPago ? Number(period.montoPago) : undefined,
    observaciones: period.observaciones || undefined,
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
  };
};

/**
 * Open exam period (change status to ABIERTO)
 */
export const openExamPeriod = async (
  id: string,
  updatedBy?: string
): Promise<ExamPeriodResponseDto> => {
  return updateExamPeriod(id, { estatus: 'ABIERTO' }, updatedBy);
};

/**
 * Close exam period (change status to CERRADO)
 */
export const closeExamPeriod = async (
  id: string,
  updatedBy?: string
): Promise<ExamPeriodResponseDto> => {
  return updateExamPeriod(id, { estatus: 'CERRADO' }, updatedBy);
};

/**
 * Get available exam periods for students
 * Returns periods that are open and have available capacity
 */
export const getAvailableExamPeriods = async (): Promise<AvailableExamPeriodResponseDto[]> => {
  const now = new Date();

  const periods = await (prisma as any).diagnostic_exam_periods.findMany({
    where: {
      estatus: 'ABIERTO',
      deletedAt: null,
      fechaInscripcionInicio: { lte: now },
      fechaInscripcionFin: { gte: now },
    },
    orderBy: {
      fechaInscripcionInicio: 'asc',
    },
  });

  return periods.map((period: any) => {
    const cuposDisponibles = period.cupoMaximo - period.cupoActual;
    const estaDisponible = cuposDisponibles > 0;

    return {
      id: period.id,
      nombre: period.nombre,
      descripcion: period.descripcion || undefined,
      fechaInicio: period.fechaInicio.toISOString(),
      fechaFin: period.fechaFin.toISOString(),
      fechaInscripcionInicio: period.fechaInscripcionInicio.toISOString(),
      fechaInscripcionFin: period.fechaInscripcionFin.toISOString(),
      cupoMaximo: period.cupoMaximo,
      cupoActual: period.cupoActual,
      cuposDisponibles,
      requierePago: period.requierePago,
      montoPago: period.montoPago ? Number(period.montoPago) : undefined,
      estaDisponible,
    };
  });
};

/**
 * Increment cupoActual when a student enrolls
 */
export const incrementExamPeriodCapacity = async (periodId: string): Promise<void> => {
  await (prisma as any).diagnostic_exam_periods.update({
    where: { id: periodId },
    data: {
      cupoActual: { increment: 1 },
    },
  });
};



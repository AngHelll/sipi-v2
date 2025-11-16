// Export controller - Handle export requests
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as exportService from './export.service';

/**
 * GET /api/export/students
 * Export students to Excel
 * ADMIN only
 */
export const exportStudents = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    carrera: req.query.carrera as string | undefined,
    semestre: req.query.semestre ? parseInt(String(req.query.semestre), 10) : undefined,
    estatus: req.query.estatus as string | undefined,
  };

  const buffer = await exportService.exportStudents(filters);

  const filename = `estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

/**
 * GET /api/export/teachers
 * Export teachers to Excel
 * ADMIN only
 */
export const exportTeachers = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    departamento: req.query.departamento as string | undefined,
  };

  const buffer = await exportService.exportTeachers(filters);

  const filename = `maestros_${new Date().toISOString().split('T')[0]}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

/**
 * GET /api/export/subjects
 * Export subjects to Excel
 * ADMIN only
 */
export const exportSubjects = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await exportService.exportSubjects();

  const filename = `materias_${new Date().toISOString().split('T')[0]}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

/**
 * GET /api/export/groups
 * Export groups to Excel
 * ADMIN only
 */
export const exportGroups = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    periodo: req.query.periodo as string | undefined,
    subjectId: req.query.subjectId as string | undefined,
  };

  const buffer = await exportService.exportGroups(filters);

  const filename = `grupos_${new Date().toISOString().split('T')[0]}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});


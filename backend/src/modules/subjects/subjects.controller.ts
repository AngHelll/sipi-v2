// Subjects controller - Request/response handling for subject management
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as subjectsService from './subjects.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectQueryDto,
} from './subjects.dtos';

/**
 * GET /api/subjects
 * Get all subjects with optional filters and pagination
 * ADMIN only
 */
export const getAllSubjects = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SubjectQueryDto;

  // Validate pagination
  const page = query.page ? parseInt(String(query.page), 10) : 1;
  const limit = query.limit ? parseInt(String(query.limit), 10) : 20;
  const creditos = query.creditos ? parseInt(String(query.creditos), 10) : undefined;

  if (page < 1) {
    res.status(400).json({ error: 'Page must be greater than 0' });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({ error: 'Limit must be between 1 and 100' });
    return;
  }

  const result = await subjectsService.getAllSubjects({
    ...query,
    page,
    limit,
    creditos,
  });

  res.json(result);
});

/**
 * POST /api/subjects
 * Create a new subject
 * ADMIN only
 */
export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateSubjectDto;

  // Validate required fields
  if (!data.clave || !data.nombre || data.creditos === undefined) {
    res.status(400).json({ 
      error: 'All fields are required: clave, nombre, creditos' 
    });
    return;
  }

  // Validate creditos range
  if (data.creditos < 1 || data.creditos > 20) {
    res.status(400).json({ error: 'Creditos must be between 1 and 20' });
    return;
  }

  try {
    const subject = await subjectsService.createSubject(data);
    res.status(201).json(subject);
  } catch (error: any) {
    if (error.message === 'Clave already exists') {
      res.status(409).json({ error: 'Clave already exists' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * GET /api/subjects/:id
 * Get a single subject by ID
 * ADMIN only
 */
export const getSubjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const subject = await subjectsService.getSubjectById(id);
    res.json(subject);
  } catch (error: any) {
    if (error.message === 'Subject not found') {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * PUT /api/subjects/:id
 * Update subject information
 * ADMIN only
 */
export const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateSubjectDto;

  // Validate creditos if provided
  if (data.creditos !== undefined && (data.creditos < 1 || data.creditos > 20)) {
    res.status(400).json({ error: 'Creditos must be between 1 and 20' });
    return;
  }

  try {
    const subject = await subjectsService.updateSubject(id, data);
    res.json(subject);
  } catch (error: any) {
    if (error.message === 'Subject not found') {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * DELETE /api/subjects/:id
 * Delete a subject
 * Cannot delete if subject has groups
 * ADMIN only
 */
export const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await subjectsService.deleteSubject(id);
    res.status(200).json({ 
      message: 'Subject deleted successfully',
      deletedId: id 
    });
  } catch (error: any) {
    if (error.message === 'Subject not found') {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    if (error.message?.includes('Cannot delete subject')) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});


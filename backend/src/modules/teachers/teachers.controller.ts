// Teachers controller - Request/response handling for teacher management
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as teachersService from './teachers.service';
import {
  CreateTeacherDto,
  UpdateTeacherDto,
  TeacherQueryDto,
} from './teachers.dtos';

/**
 * GET /api/teachers
 * Get all teachers with optional filters and pagination
 * ADMIN only
 */
export const getAllTeachers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as TeacherQueryDto;

  // Validate pagination
  const page = query.page ? parseInt(String(query.page), 10) : 1;
  const limit = query.limit ? parseInt(String(query.limit), 10) : 20;

  if (page < 1) {
    res.status(400).json({ error: 'Page must be greater than 0' });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({ error: 'Limit must be between 1 and 100' });
    return;
  }

  const result = await teachersService.getAllTeachers({
    ...query,
    page,
    limit,
  });

  res.json(result);
});

/**
 * POST /api/teachers
 * Create a new teacher with associated user account
 * ADMIN only
 */
export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateTeacherDto;

  // Validate required fields
  if (!data.user || !data.teacher) {
    res.status(400).json({ error: 'User and teacher data are required' });
    return;
  }

  if (!data.user.username || !data.user.password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (data.user.password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  if (!data.teacher.nombre || !data.teacher.apellidoPaterno ||
      !data.teacher.apellidoMaterno || !data.teacher.departamento) {
    res.status(400).json({ 
      error: 'All teacher fields are required: nombre, apellidoPaterno, apellidoMaterno, departamento' 
    });
    return;
  }

  // Ensure role is TEACHER
  data.user.role = 'TEACHER';

  try {
    const teacher = await teachersService.createTeacher(data);
    res.status(201).json(teacher);
  } catch (error: any) {
    if (error.message === 'Username already exists') {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * GET /api/teachers/:id
 * Get a single teacher by ID
 * ADMIN only
 */
export const getTeacherById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const teacher = await teachersService.getTeacherById(id);
    res.json(teacher);
  } catch (error: any) {
    if (error.message === 'Teacher not found') {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * PUT /api/teachers/:id
 * Update teacher information
 * ADMIN only
 */
export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = req.body as UpdateTeacherDto;

  try {
    const teacher = await teachersService.updateTeacher(id, data);
    res.json(teacher);
  } catch (error: any) {
    if (error.message === 'Teacher not found') {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * DELETE /api/teachers/:id
 * Delete a teacher and associated user account
 * Cannot delete if teacher has groups assigned
 * ADMIN only
 */
export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    await teachersService.deleteTeacher(id);
    res.status(200).json({ 
      message: 'Teacher deleted successfully',
      deletedId: id 
    });
  } catch (error: any) {
    if (error.message === 'Teacher not found') {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }
    if (error.message?.includes('Cannot delete teacher')) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});


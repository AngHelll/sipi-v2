// Students controller - Request/response handling for student management
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as studentsService from './students.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentQueryDto,
} from './students.dtos';

/**
 * GET /api/students
 * Get all students with optional filters and pagination
 * ADMIN only
 */
export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as StudentQueryDto;

  // Validate pagination
  const page = query.page ? parseInt(String(query.page), 10) : 1;
  const limit = query.limit ? parseInt(String(query.limit), 10) : 20;
  const semestre = query.semestre ? parseInt(String(query.semestre), 10) : undefined;

  if (page < 1) {
    res.status(400).json({ error: 'Page must be greater than 0' });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({ error: 'Limit must be between 1 and 100' });
    return;
  }

  const result = await studentsService.getAllStudents({
    ...query,
    page,
    limit,
    semestre,
  });

  res.json(result);
});

/**
 * POST /api/students
 * Create a new student with associated user account
 * ADMIN only
 */
export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateStudentDto;

  // Validate required fields
  if (!data.user || !data.student) {
    res.status(400).json({ error: 'User and student data are required' });
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

  if (!data.student.matricula || !data.student.nombre || !data.student.apellidoPaterno ||
      !data.student.apellidoMaterno || !data.student.carrera || 
      data.student.semestre === undefined || !data.student.estatus) {
    res.status(400).json({ 
      error: 'All student fields are required: matricula, nombre, apellidoPaterno, apellidoMaterno, carrera, semestre, estatus' 
    });
    return;
  }

  // Validate semestre range
  if (data.student.semestre < 1 || data.student.semestre > 12) {
    res.status(400).json({ error: 'Semestre must be between 1 and 12' });
    return;
  }

  // Validate estatus (Prisma enum will validate, but we check here for better error messages)
  const validStatuses = ['ACTIVO', 'INACTIVO', 'EGRESADO'];
  if (!validStatuses.includes(data.student.estatus)) {
    res.status(400).json({ 
      error: `Estatus must be one of: ${validStatuses.join(', ')}` 
    });
    return;
  }

  // Ensure role is STUDENT
  data.user.role = 'STUDENT';

  try {
    const student = await studentsService.createStudent(data);
    res.status(201).json(student);
  } catch (error: any) {
    if (error.message === 'Username already exists') {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }
    if (error.message === 'Matrícula already exists') {
      res.status(409).json({ error: 'Matrícula already exists' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * GET /api/students/:id
 * Get a single student by ID
 * ADMIN only
 */
export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const student = await studentsService.getStudentById(id);
    res.json(student);
  } catch (error: any) {
    if (error.message === 'Student not found') {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * PUT /api/students/:id
 * Update student information
 * ADMIN only
 */
export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = req.body as UpdateStudentDto;

  // Validate semestre if provided
  if (data.semestre !== undefined && (data.semestre < 1 || data.semestre > 12)) {
    res.status(400).json({ error: 'Semestre must be between 1 and 12' });
    return;
  }

  // Validate estatus if provided
  if (data.estatus !== undefined) {
    const validStatuses = ['ACTIVO', 'INACTIVO', 'EGRESADO'];
    if (!validStatuses.includes(data.estatus)) {
      res.status(400).json({ 
        error: `Estatus must be one of: ${validStatuses.join(', ')}` 
      });
      return;
    }
  }

  try {
    const student = await studentsService.updateStudent(id, data);
    res.json(student);
  } catch (error: any) {
    if (error.message === 'Student not found') {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * GET /api/students/me
 * Get complete information of the currently authenticated student
 * STUDENT only
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'STUDENT') {
    res.status(403).json({ error: 'Access denied. Student role required.' });
    return;
  }

  try {
    const student = await studentsService.getStudentByUserId(req.user.userId);
    res.json(student);
  } catch (error: any) {
    if (error.message === 'Student not found') {
      res.status(404).json({ 
        error: 'Student profile not found. Please contact administrator.' 
      });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});

/**
 * DELETE /api/students/:id
 * Delete a student and associated user account
 * Also deletes all enrollments (cascade)
 * ADMIN only
 */
export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    await studentsService.deleteStudent(id);
    res.status(200).json({ 
      message: 'Student deleted successfully',
      deletedId: id 
    });
  } catch (error: any) {
    if (error.message === 'Student not found') {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});


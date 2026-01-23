// Enrollments controller - Request/response handling for enrollment management
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as enrollmentsService from './enrollments.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './enrollments.dtos';

/**
 * GET /api/enrollments/me
 * Get all enrollments for the current student
 * Only STUDENT role can access this endpoint
 */
export const getEnrollmentsMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Get pagination params
  const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

  // Validate pagination
  if (page < 1) {
    res.status(400).json({ error: 'Page must be greater than 0' });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({ error: 'Limit must be between 1 and 100' });
    return;
  }

  const result = await enrollmentsService.getEnrollmentsMe(userId, page, limit);
  res.json(result);
});

/**
 * GET /api/enrollments
 * Get all enrollments (ADMIN only)
 * Supports filtering by studentId, groupId, estatus, tipoInscripcion, aprobado
 */
export const getAllEnrollments = asyncHandler(async (req: Request, res: Response) => {
  // Get pagination params
  const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

  // Validate pagination
  if (page < 1) {
    res.status(400).json({ error: 'Page must be greater than 0' });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({ error: 'Limit must be between 1 and 100' });
    return;
  }

  // Get filter params
  const query: any = {
    page,
    limit,
    sortBy: req.query.sortBy || 'fechaInscripcion',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  if (req.query.studentId) {
    query.studentId = String(req.query.studentId);
  }
  if (req.query.groupId) {
    query.groupId = String(req.query.groupId);
  }
  if (req.query.estatus) {
    query.estatus = String(req.query.estatus);
  }
  if (req.query.tipoInscripcion) {
    query.tipoInscripcion = String(req.query.tipoInscripcion);
  }
  if (req.query.aprobado !== undefined) {
    const aprobadoValue = String(req.query.aprobado);
    query.aprobado = aprobadoValue === 'true';
  }

  const result = await enrollmentsService.getAllEnrollments(query);
  res.json(result);
});

/**
 * GET /api/enrollments/:id
 * Get a specific enrollment by ID
 * ADMIN can access any enrollment
 * TEACHER can only access enrollments for their own groups
 * STUDENT can only access their own enrollments
 */
export const getEnrollmentById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  const enrollment = await enrollmentsService.getEnrollmentById(id, userId, userRole);

  if (!enrollment) {
    res.status(404).json({ error: 'Enrollment not found' });
    return;
  }

  res.json(enrollment);
});

/**
 * GET /api/enrollments/group/:groupId
 * Get all enrollments for a specific group
 * TEACHER can only access enrollments for their own groups
 * ADMIN can access enrollments for any group
 */
export const getEnrollmentsByGroup = asyncHandler(async (req: Request, res: Response) => {
  const groupId = String(req.params.groupId);
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const result = await enrollmentsService.getEnrollmentsByGroup(groupId, userId, userRole);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Group not found') {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    if (error.message === 'You can only view enrollments for your own groups') {
      res.status(403).json({ error: 'You can only view enrollments for your own groups' });
      return;
    }
    throw error;
  }
});

/**
 * POST /api/enrollments
 * Create a new enrollment
 * Only ADMIN can create enrollments
 */
export const createEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateEnrollmentDto;

  // Validate required fields
  if (!data.studentId || !data.groupId) {
    res.status(400).json({
      error: 'Missing required fields',
      details: {
        required: ['studentId', 'groupId'],
      },
    });
    return;
  }

  try {
    const enrollment = await enrollmentsService.createEnrollment(data);
    res.status(201).json(enrollment);
  } catch (error: any) {
    if (error.message === 'Student not found') {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    if (error.message === 'Group not found') {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    if (error.message === 'Student is already enrolled in this group') {
      res.status(409).json({ error: 'Student is already enrolled in this group' });
      return;
    }
    if (error.message === 'Calificacion must be between 0 and 100') {
      res.status(400).json({ error: 'Calificacion must be between 0 and 100' });
      return;
    }
    throw error;
  }
});

/**
 * PUT /api/enrollments/:id
 * Update an existing enrollment
 * TEACHER can only update calificacion (for their own groups)
 * ADMIN can update all fields
 */
export const updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = req.body as UpdateEnrollmentDto;

  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Validate that at least one field is provided
  if (
    data.calificacion === undefined &&
    !data.studentId &&
    !data.groupId
  ) {
    res.status(400).json({
      error: 'At least one field must be provided',
      details: {
        allowedFields: userRole === 'TEACHER' 
          ? ['calificacion'] 
          : ['calificacion', 'studentId', 'groupId'],
      },
    });
    return;
  }

  try {
    const enrollment = await enrollmentsService.updateEnrollment(
      id,
      data,
      userId,
      userRole
    );
    res.json(enrollment);
  } catch (error: any) {
    if (error.message === 'Enrollment not found') {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }
    if (error.message === 'Teacher not found') {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }
    if (error.message === 'You can only update grades for your own groups') {
      res.status(403).json({ error: 'You can only update grades for your own groups' });
      return;
    }
    if (error.message === 'Teachers can only update calificacion') {
      res.status(403).json({ error: 'Teachers can only update calificacion' });
      return;
    }
    if (error.message === 'Student not found') {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    if (error.message === 'Group not found') {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    if (error.message === 'Student is already enrolled in this group') {
      res.status(409).json({ error: 'Student is already enrolled in this group' });
      return;
    }
    if (error.message === 'Calificacion must be between 0 and 100') {
      res.status(400).json({ error: 'Calificacion must be between 0 and 100' });
      return;
    }
    throw error;
  }
});

/**
 * DELETE /api/enrollments/:id
 * Delete an enrollment
 * ADMIN only
 */
export const deleteEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    await enrollmentsService.deleteEnrollment(id);
    res.status(200).json({ 
      message: 'Enrollment deleted successfully',
      deletedId: id 
    });
  } catch (error: any) {
    if (error.message === 'Enrollment not found') {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});


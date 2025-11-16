// Groups controller - Request/response handling for group management
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as groupsService from './groups.service';
import { CreateGroupDto, UpdateGroupDto, GroupQueryDto } from './groups.dtos';

/**
 * GET /api/groups
 * Get all groups with optional filters and pagination
 * Role-based access:
 * - ADMIN: sees all groups
 * - TEACHER: sees only groups where teacherId = current user's Teacher record
 * - STUDENT: sees groups where they are enrolled
 */
export const getAllGroups = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as GroupQueryDto;

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

  // Get user info from authenticated request
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const result = await groupsService.getAllGroups(
    {
      ...query,
      page,
      limit,
    },
    userId,
    userRole
  );

  res.json(result);
});

/**
 * GET /api/groups/:id
 * Get a single group by ID
 */
export const getGroupById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const group = await groupsService.getGroupById(id);

  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  res.json(group);
});

/**
 * POST /api/groups
 * Create a new group
 * Only ADMIN can create groups
 */
export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateGroupDto;

  // Validate required fields
  if (!data.subjectId || !data.teacherId || !data.nombre || !data.periodo) {
    res.status(400).json({
      error: 'Missing required fields',
      details: {
        required: ['subjectId', 'teacherId', 'nombre', 'periodo'],
      },
    });
    return;
  }

  // Validate nombre length
  if (data.nombre.trim().length === 0) {
    res.status(400).json({ error: 'Nombre cannot be empty' });
    return;
  }

  // Validate periodo format (basic validation)
  if (data.periodo.trim().length === 0) {
    res.status(400).json({ error: 'Periodo cannot be empty' });
    return;
  }

  try {
    const group = await groupsService.createGroup(data);
    res.status(201).json(group);
  } catch (error: any) {
    if (error.message === 'Subject not found') {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    if (error.message === 'Teacher not found') {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }
    throw error;
  }
});

/**
 * PUT /api/groups/:id
 * Update an existing group
 * Only ADMIN can update groups
 */
export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateGroupDto;

  // Validate that at least one field is provided
  if (
    !data.nombre &&
    !data.periodo &&
    !data.subjectId &&
    !data.teacherId
  ) {
    res.status(400).json({
      error: 'At least one field must be provided',
      details: {
        allowedFields: ['nombre', 'periodo', 'subjectId', 'teacherId'],
      },
    });
    return;
  }

  // Validate nombre if provided
  if (data.nombre !== undefined && data.nombre.trim().length === 0) {
    res.status(400).json({ error: 'Nombre cannot be empty' });
    return;
  }

  // Validate periodo if provided
  if (data.periodo !== undefined && data.periodo.trim().length === 0) {
    res.status(400).json({ error: 'Periodo cannot be empty' });
    return;
  }

  try {
    const group = await groupsService.updateGroup(id, data);
    res.json(group);
  } catch (error: any) {
    if (error.message === 'Group not found') {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    if (error.message === 'Subject not found') {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    if (error.message === 'Teacher not found') {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }
    throw error;
  }
});

/**
 * DELETE /api/groups/:id
 * Delete a group and all associated enrollments (cascade)
 * ADMIN only
 */
export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await groupsService.deleteGroup(id);
    res.status(200).json({ 
      message: 'Group deleted successfully',
      deletedId: id 
    });
  } catch (error: any) {
    if (error.message === 'Group not found') {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    throw error; // Re-throw to be handled by errorHandler
  }
});


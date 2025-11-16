// Subjects service - Business logic for subject management
import prisma from '../../config/database';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectQueryDto,
  SubjectResponseDto,
  SubjectsListResponseDto,
} from './subjects.dtos';

/**
 * Create a new subject
 */
export const createSubject = async (
  data: CreateSubjectDto
): Promise<SubjectResponseDto> => {
  // Check if clave already exists
  const existingSubject = await prisma.subject.findUnique({
    where: { clave: data.clave },
  });

  if (existingSubject) {
    throw new Error('Clave already exists');
  }

  const subject = await prisma.subject.create({
    data: {
      clave: data.clave,
      nombre: data.nombre,
      creditos: data.creditos,
    },
  });

  return {
    id: subject.id,
    clave: subject.clave,
    nombre: subject.nombre,
    creditos: subject.creditos,
  };
};

/**
 * Get all subjects with optional filters and pagination
 */
export const getAllSubjects = async (
  query: SubjectQueryDto
): Promise<SubjectsListResponseDto> => {
  const {
    clave,
    nombre,
    creditos,
    page = 1,
    limit = 20,
    sortBy = 'nombre',
    sortOrder = 'asc',
  } = query;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (clave) {
    where.clave = { contains: clave };
  }
  if (nombre) {
    where.nombre = { contains: nombre };
  }
  if (creditos !== undefined) {
    where.creditos = creditos;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Build orderBy clause
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortOrder;

  // Get total count
  const total = await prisma.subject.count({ where });

  // Get subjects
  const subjects = await prisma.subject.findMany({
    where,
    skip,
    take,
    orderBy,
  });

  return {
    subjects: subjects.map((subject) => ({
      id: subject.id,
      clave: subject.clave,
      nombre: subject.nombre,
      creditos: subject.creditos,
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
 * Get subject by ID
 */
export const getSubjectById = async (
  id: string
): Promise<SubjectResponseDto> => {
  const subject = await prisma.subject.findUnique({
    where: { id },
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  return {
    id: subject.id,
    clave: subject.clave,
    nombre: subject.nombre,
    creditos: subject.creditos,
  };
};

/**
 * Update subject information
 */
export const updateSubject = async (
  id: string,
  data: UpdateSubjectDto
): Promise<SubjectResponseDto> => {
  // Check if subject exists
  const existingSubject = await prisma.subject.findUnique({
    where: { id },
  });

  if (!existingSubject) {
    throw new Error('Subject not found');
  }

  // Build update data (only include provided fields)
  const updateData: Record<string, unknown> = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.creditos !== undefined) updateData.creditos = data.creditos;
  // Note: clave cannot be updated

  const subject = await prisma.subject.update({
    where: { id },
    data: updateData,
  });

  return {
    id: subject.id,
    clave: subject.clave,
    nombre: subject.nombre,
    creditos: subject.creditos,
  };
};

/**
 * Delete a subject
 * Cannot delete if subject has groups (onDelete: Restrict)
 * ADMIN only
 */
export const deleteSubject = async (id: string): Promise<void> => {
  // Check if subject exists
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      groups: {
        select: { id: true },
      },
    },
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Check if subject has groups
  if (subject.groups.length > 0) {
    throw new Error(
      `Cannot delete subject: ${subject.nombre} (${subject.clave}). Subject has ${subject.groups.length} group(s). Please delete or reassign groups first.`
    );
  }

  // Delete subject
  await prisma.subject.delete({
    where: { id },
  });
};


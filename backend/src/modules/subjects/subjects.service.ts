// Subjects service - Business logic for subject management
import { randomUUID } from 'node:crypto';
import prisma from '../../config/database';
import { cache, generateCacheKey } from '../../utils/cache';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectQueryDto,
  SubjectResponseDto,
  SubjectsListResponseDto,
} from './subjects.dtos';
import { SubjectValidators } from './subjects.validators';

/**
 * Helper function to map Prisma subject to response DTO
 */
const mapSubjectToResponseDto = (subject: any): SubjectResponseDto => {
  return {
    id: subject.id,
    clave: subject.clave,
    nombre: subject.nombre,
    creditos: subject.creditos,
    // New fields (Phase 3)
    tipo: subject.tipo || undefined,
    estatus: subject.estatus || undefined,
    nivel: subject.nivel || undefined,
    horasTeoria: subject.horasTeoria || undefined,
    horasPractica: subject.horasPractica || undefined,
    horasLaboratorio: subject.horasLaboratorio || undefined,
    descripcion: subject.descripcion || undefined,
    carreraId: subject.carreraId || undefined,
    gruposActivos: subject.gruposActivos || undefined,
    estudiantesInscritos: subject.estudiantesInscritos || undefined,
  };
};

/**
 * Create a new subject
 */
export const createSubject = async (
  data: CreateSubjectDto
): Promise<SubjectResponseDto> => {
  // Apply business rule validations using validators
  await SubjectValidators.validateClaveUnique(data.clave);

  // Generate UUID for the subject
  const subjectId = randomUUID();

  // Build data object with all fields, including new ones from Phase 3
  const now = new Date();
  const subjectData: any = {
    id: subjectId,
    clave: data.clave,
    nombre: data.nombre,
    creditos: data.creditos,
    // New fields (Phase 3) - use defaults if not provided
    tipo: data.tipo || 'OBLIGATORIA',
    estatus: data.estatus || 'ACTIVA',
    nivel: data.nivel ?? null,
    horasTeoria: data.horasTeoria ?? 0,
    horasPractica: data.horasPractica ?? 0,
    horasLaboratorio: data.horasLaboratorio ?? 0,
    descripcion: data.descripcion ?? null,
    carreraId: data.carreraId ?? null,
    gruposActivos: 0,
    estudiantesInscritos: 0,
    createdAt: now,
    updatedAt: now,
  };

  const subject = await prisma.subjects.create({
    data: subjectData,
  });

  // Invalidate cache for subjects list (clear all subject list caches)
  cache.invalidatePrefix('subjects:list:');

  return mapSubjectToResponseDto(subject);
};

/**
 * Get all subjects with optional filters and pagination
 * Cached for 2 minutes to reduce database load
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

  // Generate cache key from query parameters
  const cacheKey = generateCacheKey('subjects:list', {
    clave,
    nombre,
    creditos,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  // Try to get from cache first
  const cached = cache.get<SubjectsListResponseDto>(cacheKey);
  if (cached !== null) {
    return cached; // Cache hit - return immediately without DB query
  }

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
  const total = await prisma.subjects.count({ where });

  // Get subjects
  const subjects = await prisma.subjects.findMany({
    where,
    skip,
    take,
    orderBy,
  });

  const result: SubjectsListResponseDto = {
    subjects: subjects.map((subject) => mapSubjectToResponseDto(subject)),
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };

  // Store in cache for 2 minutes (only if result is not too large)
  if (subjects.length <= 100) {
    cache.set(cacheKey, result);
  }

  return result;
};

/**
 * Get subject by ID
 */
export const getSubjectById = async (
  id: string
): Promise<SubjectResponseDto> => {
  // Validate that subject exists
  await SubjectValidators.validateSubjectExists(id);

  const subject = await prisma.subjects.findUnique({
    where: { id },
  });

  return mapSubjectToResponseDto(subject!);
};

/**
 * Update subject information
 */
export const updateSubject = async (
  id: string,
  data: UpdateSubjectDto
): Promise<SubjectResponseDto> => {
  // Validate that subject exists
  await SubjectValidators.validateSubjectExists(id);

  const existingSubject = await prisma.subjects.findUnique({
    where: { id },
  });

  // Build update data (only include provided fields)
  const updateData: Record<string, unknown> = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.creditos !== undefined) updateData.creditos = data.creditos;
  // New fields (Phase 3)
  if (data.tipo !== undefined) updateData.tipo = data.tipo;
  if (data.estatus !== undefined) updateData.estatus = data.estatus;
  if (data.nivel !== undefined) updateData.nivel = data.nivel;
  if (data.horasTeoria !== undefined) updateData.horasTeoria = data.horasTeoria;
  if (data.horasPractica !== undefined) updateData.horasPractica = data.horasPractica;
  if (data.horasLaboratorio !== undefined) updateData.horasLaboratorio = data.horasLaboratorio;
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
  if (data.carreraId !== undefined) updateData.carreraId = data.carreraId;
  // Note: clave cannot be updated

  const subject = await prisma.subjects.update({
    where: { id },
    data: updateData,
  });

  return mapSubjectToResponseDto(subject);
};

/**
 * Delete a subject
 * Cannot delete if subject has groups (onDelete: Restrict)
 * ADMIN only
 */
export const deleteSubject = async (id: string): Promise<void> => {
  // Validate that subject can be deleted (exists and has no groups)
  await SubjectValidators.validateSubjectCanBeDeleted(id);

  // Delete subject
  await prisma.subjects.delete({
    where: { id },
  });
};


// Groups service - Business logic for group management
import { randomUUID } from 'node:crypto';
import prisma from '../../config/database';
import { Prisma } from '@prisma/client';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupQueryDto,
  GroupResponseDto,
  GroupsListResponseDto,
} from './groups.dtos';
import { GroupValidators } from './groups.validators';

/**
 * Get all groups with optional filters and pagination
 * Role-based filtering:
 * - ADMIN: sees all groups
 * - TEACHER: sees only groups where teacherId = current user's Teacher record
 * - STUDENT: sees groups where they are enrolled (via Enrollment)
 */
export const getAllGroups = async (
  query: GroupQueryDto,
  userId?: string,
  userRole?: string
): Promise<GroupsListResponseDto> => {
  const {
    periodo,
    subjectId,
    esCursoIngles,
    nivelIngles,
    page = 1,
    limit = 20,
    sortBy = 'nombre',
    sortOrder = 'asc',
  } = query;

  // Build where clause
  const where: Record<string, unknown> = {};

  // Role-based filtering
  if (userRole === 'TEACHER' && userId) {
    // Find teacher record for this user
    const teacher = await prisma.teachers.findUnique({
      where: { userId },
    });

    if (!teacher) {
      // Teacher not found, return empty result
      return {
        groups: [],
        pagination: {
          page,
          limit: Math.min(limit, 100),
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Filter by teacherId
    where.teacherId = teacher.id;
  } else if (userRole === 'STUDENT' && userId) {
    // Find student record for this user
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student) {
      // Student not found, return empty result
      return {
        groups: [],
        pagination: {
          page,
          limit: Math.min(limit, 100),
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Get enrollments for this student
    const enrollments = await prisma.enrollments.findMany({
      where: { studentId: student.id },
      select: { groupId: true },
    });

    const groupIds = enrollments.map((e) => e.groupId);

    if (groupIds.length === 0) {
      // No enrollments, return empty result
      return {
        groups: [],
        pagination: {
          page,
          limit: Math.min(limit, 100),
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Filter by groupIds where student is enrolled
    where.id = { in: groupIds };
  }
  // ADMIN: no additional filtering (sees all groups)

  // Apply optional filters
  if (periodo) {
    where.periodo = periodo;
  }
  if (subjectId) {
    where.subjectId = subjectId;
  }
  if (esCursoIngles !== undefined) {
    where.esCursoIngles = esCursoIngles;
  }
  if (nivelIngles !== undefined) {
    where.nivelIngles = nivelIngles;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Build orderBy clause
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortOrder;

  // Get total count
  const total = await prisma.groups.count({ where });

  // Get groups with related data
  const groups = await prisma.groups.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      subjects: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
      teachers: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          departamento: true,
        },
      },
    },
  });

  return {
    groups: groups.map((group) => ({
      id: group.id,
      subjectId: group.subjectId,
      teacherId: group.teacherId,
      nombre: group.nombre,
      periodo: group.periodo,
      codigo: group.codigo,
      cupoMaximo: group.cupoMaximo,
      cupoMinimo: group.cupoMinimo,
      cupoActual: group.cupoActual,
      horario: group.horario || undefined,
      aula: group.aula || undefined,
      edificio: group.edificio || undefined,
      modalidad: group.modalidad || undefined,
      estatus: group.estatus || undefined,
      nivelIngles: group.nivelIngles ?? undefined,
      fechaInscripcionInicio: group.fechaInscripcionInicio?.toISOString(),
      fechaInscripcionFin: group.fechaInscripcionFin?.toISOString(),
      esCursoIngles: group.esCursoIngles ?? false,
      subject: {
        id: group.subjects.id,
        clave: group.subjects.clave,
        nombre: group.subjects.nombre,
        creditos: group.subjects.creditos,
      },
      teacher: {
        id: group.teachers.id,
        nombre: group.teachers.nombre,
        apellidoPaterno: group.teachers.apellidoPaterno,
        apellidoMaterno: group.teachers.apellidoMaterno,
        departamento: group.teachers.departamento,
      },
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
 * Get a single group by ID
 */
export const getGroupById = async (id: string): Promise<GroupResponseDto | null> => {
  const group = await prisma.groups.findUnique({
    where: { id },
    include: {
      subjects: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
      teachers: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          departamento: true,
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  return {
    id: group.id,
    subjectId: group.subjectId,
    teacherId: group.teacherId,
    nombre: group.nombre,
    periodo: group.periodo,
    codigo: group.codigo,
    cupoMaximo: group.cupoMaximo,
    cupoMinimo: group.cupoMinimo,
    cupoActual: group.cupoActual,
    horario: group.horario || undefined,
    aula: group.aula || undefined,
    edificio: group.edificio || undefined,
    modalidad: group.modalidad || undefined,
    estatus: group.estatus || undefined,
    nivelIngles: group.nivelIngles ?? undefined,
    fechaInscripcionInicio: group.fechaInscripcionInicio?.toISOString(),
    fechaInscripcionFin: group.fechaInscripcionFin?.toISOString(),
    esCursoIngles: group.esCursoIngles ?? false,
    subject: {
      id: group.subjects.id,
      clave: group.subjects.clave,
      nombre: group.subjects.nombre,
      creditos: group.subjects.creditos,
    },
    teacher: {
      id: group.teachers.id,
      nombre: group.teachers.nombre,
      apellidoPaterno: group.teachers.apellidoPaterno,
      apellidoMaterno: group.teachers.apellidoMaterno,
      departamento: group.teachers.departamento,
    },
  };
};

/**
 * Create a new group
 * Validates that subjectId and teacherId exist
 */
export const createGroup = async (
  data: CreateGroupDto
): Promise<GroupResponseDto> => {
  const { 
      subjectId,
      teacherId,
      nombre,
      periodo,
    nivelIngles,
    fechaInscripcionInicio,
    fechaInscripcionFin,
    esCursoIngles
  } = data;

  // Apply business rule validations using validators
  await GroupValidators.validateSubjectExists(subjectId);
  await GroupValidators.validateTeacherExists(teacherId);

  // Generate UUID for group
  const groupId = randomUUID();

  // Generate unique code for group
  const codeCount = await prisma.groups.count();
  const codigo = `GRP-${String(codeCount + 1).padStart(6, '0')}`;

  // Define the include type for better type safety
  const groupInclude = {
    subjects: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
    teachers: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          departamento: true,
        },
      },
  } as const;

  // Prepare data for creation
  const createData: Prisma.groupsUncheckedCreateInput = {
    id: groupId,
    subjectId,
    teacherId,
    nombre,
    periodo,
    codigo,
    cupoMaximo: 30,
    cupoMinimo: 5,
    cupoActual: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Add optional fields for English courses
  if (nivelIngles !== undefined) createData.nivelIngles = nivelIngles;
  if (fechaInscripcionInicio) createData.fechaInscripcionInicio = new Date(fechaInscripcionInicio);
  if (fechaInscripcionFin) createData.fechaInscripcionFin = new Date(fechaInscripcionFin);
  if (esCursoIngles !== undefined) createData.esCursoIngles = esCursoIngles;

  // Create group
  const group = await prisma.groups.create({
    data: createData,
    include: groupInclude,
  }) as Prisma.groupsGetPayload<{ include: typeof groupInclude }> & {
    codigo: string;
    cupoMaximo: number;
    cupoMinimo: number;
    cupoActual: number;
    nivelIngles?: number | null;
    fechaInscripcionInicio?: Date | null;
    fechaInscripcionFin?: Date | null;
    esCursoIngles?: boolean;
  };

  return {
    id: group.id,
    subjectId: group.subjectId,
    teacherId: group.teacherId,
    nombre: group.nombre,
    periodo: group.periodo,
    codigo: group.codigo,
    cupoMaximo: group.cupoMaximo,
    cupoMinimo: group.cupoMinimo,
    cupoActual: group.cupoActual,
    horario: group.horario || undefined,
    aula: group.aula || undefined,
    edificio: group.edificio || undefined,
    modalidad: group.modalidad || undefined,
    estatus: group.estatus || undefined,
    nivelIngles: group.nivelIngles ?? undefined,
    fechaInscripcionInicio: group.fechaInscripcionInicio?.toISOString(),
    fechaInscripcionFin: group.fechaInscripcionFin?.toISOString(),
    esCursoIngles: group.esCursoIngles ?? false,
    subject: {
      id: group.subjects.id,
      clave: group.subjects.clave,
      nombre: group.subjects.nombre,
      creditos: group.subjects.creditos,
    },
    teacher: {
      id: group.teachers.id,
      nombre: group.teachers.nombre,
      apellidoPaterno: group.teachers.apellidoPaterno,
      apellidoMaterno: group.teachers.apellidoMaterno,
      departamento: group.teachers.departamento,
    },
  };
};

/**
 * Delete a group
 * Also deletes all enrollments (cascade)
 * ADMIN only
 */
export const deleteGroup = async (id: string): Promise<void> => {
  // Check if group exists
  const group = await prisma.groups.findUnique({
    where: { id },
    include: {
      enrollments: {
        select: { id: true },
      },
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Delete group (this will cascade delete enrollments due to onDelete: Cascade)
  await prisma.groups.delete({
    where: { id },
  });
};

/**
 * Update an existing group
 * Validates that subjectId and teacherId exist if provided
 */
export const updateGroup = async (
  id: string,
  data: UpdateGroupDto
): Promise<GroupResponseDto> => {
  // Check if group exists
  const existingGroup = await prisma.groups.findUnique({
    where: { id },
  });

  if (!existingGroup) {
    throw new Error('Group not found');
  }

  // Validate subjectId if provided
  if (data.subjectId) {
      const subject = await prisma.subjects.findUnique({
      where: { id: data.subjectId },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }
  }

  // Validate teacherId if provided
  if (data.teacherId) {
      const teacher = await prisma.teachers.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }
  }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.periodo !== undefined) updateData.periodo = data.periodo;
    if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;
    if (data.teacherId !== undefined) updateData.teacherId = data.teacherId;
    if (data.cupoMaximo !== undefined) updateData.cupoMaximo = data.cupoMaximo;
    if (data.cupoMinimo !== undefined) updateData.cupoMinimo = data.cupoMinimo;
    if (data.horario !== undefined) updateData.horario = data.horario;
    if (data.aula !== undefined) updateData.aula = data.aula;
    if (data.edificio !== undefined) updateData.edificio = data.edificio;
    if (data.modalidad !== undefined) updateData.modalidad = data.modalidad;
    if (data.estatus !== undefined) updateData.estatus = data.estatus;
    // Campos para cursos de inglés
    if (data.nivelIngles !== undefined) updateData.nivelIngles = data.nivelIngles;
    if (data.fechaInscripcionInicio !== undefined) {
      updateData.fechaInscripcionInicio = data.fechaInscripcionInicio ? new Date(data.fechaInscripcionInicio) : null;
    }
    if (data.fechaInscripcionFin !== undefined) {
      updateData.fechaInscripcionFin = data.fechaInscripcionFin ? new Date(data.fechaInscripcionFin) : null;
    }
    if (data.esCursoIngles !== undefined) updateData.esCursoIngles = data.esCursoIngles;

  // Update group
    const group = await prisma.groups.update({
    where: { id },
      data: updateData,
    include: {
        subjects: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
        teachers: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          departamento: true,
        },
      },
    },
  });

  return {
    id: group.id,
    subjectId: group.subjectId,
    teacherId: group.teacherId,
    nombre: group.nombre,
    periodo: group.periodo,
    codigo: group.codigo,
    cupoMaximo: group.cupoMaximo,
    cupoMinimo: group.cupoMinimo,
    cupoActual: group.cupoActual,
    horario: group.horario || undefined,
    aula: group.aula || undefined,
    edificio: group.edificio || undefined,
    modalidad: group.modalidad || undefined,
    estatus: group.estatus || undefined,
    nivelIngles: group.nivelIngles ?? undefined,
    fechaInscripcionInicio: group.fechaInscripcionInicio?.toISOString(),
    fechaInscripcionFin: group.fechaInscripcionFin?.toISOString(),
    esCursoIngles: group.esCursoIngles ?? false,
    subject: {
      id: group.subjects.id,
      clave: group.subjects.clave,
      nombre: group.subjects.nombre,
      creditos: group.subjects.creditos,
    },
    teacher: {
      id: group.teachers.id,
      nombre: group.teachers.nombre,
      apellidoPaterno: group.teachers.apellidoPaterno,
      apellidoMaterno: group.teachers.apellidoMaterno,
      departamento: group.teachers.departamento,
    },
  };
};

/**
 * Get available English courses for students
 * Returns courses that are open, have available capacity, and are within registration period
 */
export const getAvailableEnglishCourses = async (): Promise<GroupResponseDto[]> => {
  const now = new Date();

  // Build where clause with optional date conditions
  // If dates are not set (null), the course should still be available
  // Logic: Course is available if:
  // - fechaInscripcionInicio is null OR fechaInscripcionInicio <= now (inscriptions have started or no start date)
  // - fechaInscripcionFin is null OR fechaInscripcionFin >= now (inscriptions haven't ended or no end date)
  const whereClause: any = {
    esCursoIngles: true,
    estatus: 'ABIERTO',
    deletedAt: null,
    AND: [
      {
        OR: [
          { fechaInscripcionInicio: null },
          { fechaInscripcionInicio: { lte: now } },
        ],
      },
      {
        OR: [
          { fechaInscripcionFin: null },
          { fechaInscripcionFin: { gte: now } },
        ],
      },
    ],
  };

  const groups = await prisma.groups.findMany({
    where: whereClause,
    include: {
      subjects: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
      teachers: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          departamento: true,
        },
      },
    },
    orderBy: {
      nivelIngles: 'asc',
    },
  });

  // Filter groups with available capacity (Prisma doesn't support computed fields in where)
  const availableGroups = groups.filter((group) => group.cupoActual < group.cupoMaximo);

  return availableGroups.map((group) => {
    // Ensure subjects and teachers relations exist
    if (!group.subjects) {
      throw new Error(`Group ${group.id} (${group.nombre}) is missing subject relation`);
    }
    if (!group.teachers) {
      throw new Error(`Group ${group.id} (${group.nombre}) is missing teacher relation`);
    }

    return {
      id: group.id,
      subjectId: group.subjectId,
      teacherId: group.teacherId,
      nombre: group.nombre,
      periodo: group.periodo,
      codigo: group.codigo,
      cupoMaximo: group.cupoMaximo,
      cupoMinimo: group.cupoMinimo,
      cupoActual: group.cupoActual,
      horario: group.horario || undefined,
      aula: group.aula || undefined,
      edificio: group.edificio || undefined,
      modalidad: group.modalidad || undefined,
      estatus: group.estatus || undefined,
      nivelIngles: group.nivelIngles ?? undefined,
      fechaInscripcionInicio: group.fechaInscripcionInicio?.toISOString(),
      fechaInscripcionFin: group.fechaInscripcionFin?.toISOString(),
      esCursoIngles: group.esCursoIngles ?? false,
      subject: {
        id: group.subjects.id,
        clave: group.subjects.clave,
        nombre: group.subjects.nombre,
        creditos: group.subjects.creditos,
      },
      teacher: {
        id: group.teachers.id,
        nombre: group.teachers.nombre,
        apellidoPaterno: group.teachers.apellidoPaterno,
        apellidoMaterno: group.teachers.apellidoMaterno,
        departamento: group.teachers.departamento,
      },
    };
  });
};


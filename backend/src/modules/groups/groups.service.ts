// Groups service - Business logic for group management
import prisma from '../../config/database';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupQueryDto,
  GroupResponseDto,
  GroupsListResponseDto,
} from './groups.dtos';

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
    const teacher = await prisma.teacher.findUnique({
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
    const student = await prisma.student.findUnique({
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
    const enrollments = await prisma.enrollment.findMany({
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

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Build orderBy clause
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortOrder;

  // Get total count
  const total = await prisma.group.count({ where });

  // Get groups with related data
  const groups = await prisma.group.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      subject: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
      teacher: {
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
      subject: {
        id: group.subject.id,
        clave: group.subject.clave,
        nombre: group.subject.nombre,
        creditos: group.subject.creditos,
      },
      teacher: {
        id: group.teacher.id,
        nombre: group.teacher.nombre,
        apellidoPaterno: group.teacher.apellidoPaterno,
        apellidoMaterno: group.teacher.apellidoMaterno,
        departamento: group.teacher.departamento,
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
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      subject: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
      teacher: {
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
    subject: {
      id: group.subject.id,
      clave: group.subject.clave,
      nombre: group.subject.nombre,
      creditos: group.subject.creditos,
    },
    teacher: {
      id: group.teacher.id,
      nombre: group.teacher.nombre,
      apellidoPaterno: group.teacher.apellidoPaterno,
      apellidoMaterno: group.teacher.apellidoMaterno,
      departamento: group.teacher.departamento,
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
  const { subjectId, teacherId, nombre, periodo } = data;

  // Validate that subject exists
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Validate that teacher exists
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
  });

  if (!teacher) {
    throw new Error('Teacher not found');
  }

  // Create group
  const group = await prisma.group.create({
    data: {
      subjectId,
      teacherId,
      nombre,
      periodo,
    },
    include: {
      subject: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
      teacher: {
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
    subject: {
      id: group.subject.id,
      clave: group.subject.clave,
      nombre: group.subject.nombre,
      creditos: group.subject.creditos,
    },
    teacher: {
      id: group.teacher.id,
      nombre: group.teacher.nombre,
      apellidoPaterno: group.teacher.apellidoPaterno,
      apellidoMaterno: group.teacher.apellidoMaterno,
      departamento: group.teacher.departamento,
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
  const group = await prisma.group.findUnique({
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
  await prisma.group.delete({
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
  const existingGroup = await prisma.group.findUnique({
    where: { id },
  });

  if (!existingGroup) {
    throw new Error('Group not found');
  }

  // Validate subjectId if provided
  if (data.subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }
  }

  // Validate teacherId if provided
  if (data.teacherId) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }
  }

  // Update group
  const group = await prisma.group.update({
    where: { id },
    data: {
      nombre: data.nombre,
      periodo: data.periodo,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
    },
    include: {
      subject: {
        select: {
          id: true,
          clave: true,
          nombre: true,
          creditos: true,
        },
      },
      teacher: {
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
    subject: {
      id: group.subject.id,
      clave: group.subject.clave,
      nombre: group.subject.nombre,
      creditos: group.subject.creditos,
    },
    teacher: {
      id: group.teacher.id,
      nombre: group.teacher.nombre,
      apellidoPaterno: group.teacher.apellidoPaterno,
      apellidoMaterno: group.teacher.apellidoMaterno,
      departamento: group.teacher.departamento,
    },
  };
};


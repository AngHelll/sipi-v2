// Teachers service - Business logic for teacher management
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import {
  CreateTeacherDto,
  UpdateTeacherDto,
  TeacherQueryDto,
  TeacherResponseDto,
  TeachersListResponseDto,
} from './teachers.dtos';

/**
 * Create a new teacher with associated user account
 */
export const createTeacher = async (
  data: CreateTeacherDto
): Promise<TeacherResponseDto> => {
  const { user: userData, teacher: teacherData } = data;

  // Check if username already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: userData.username },
  });

  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, 10);

  // Create user and teacher in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        username: userData.username,
        passwordHash,
        role: 'TEACHER',
      },
    });

    // Create teacher
    const teacher = await tx.teacher.create({
      data: {
        userId: user.id,
        nombre: teacherData.nombre,
        apellidoPaterno: teacherData.apellidoPaterno,
        apellidoMaterno: teacherData.apellidoMaterno,
        departamento: teacherData.departamento,
      },
    });

    return { user, teacher };
  });

  return {
    id: result.teacher.id,
    userId: result.teacher.userId,
    nombre: result.teacher.nombre,
    apellidoPaterno: result.teacher.apellidoPaterno,
    apellidoMaterno: result.teacher.apellidoMaterno,
    departamento: result.teacher.departamento,
    user: {
      id: result.user.id,
      username: result.user.username,
      role: 'TEACHER',
      createdAt: result.user.createdAt.toISOString(),
      updatedAt: result.user.updatedAt.toISOString(),
    },
  };
};

/**
 * Get all teachers with optional filters and pagination
 */
export const getAllTeachers = async (
  query: TeacherQueryDto
): Promise<TeachersListResponseDto> => {
  const {
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    departamento,
    page = 1,
    limit = 20,
    sortBy = 'nombre',
    sortOrder = 'asc',
  } = query;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (nombre) {
    where.nombre = { contains: nombre };
  }
  if (apellidoPaterno) {
    where.apellidoPaterno = { contains: apellidoPaterno };
  }
  if (apellidoMaterno) {
    where.apellidoMaterno = { contains: apellidoMaterno };
  }
  if (departamento) {
    where.departamento = { contains: departamento };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Build orderBy clause
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortOrder;

  // Get total count
  const total = await prisma.teacher.count({ where });

  // Get teachers
  const teachers = await prisma.teacher.findMany({
    where,
    skip,
    take,
    orderBy,
  });

  return {
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      userId: teacher.userId,
      nombre: teacher.nombre,
      apellidoPaterno: teacher.apellidoPaterno,
      apellidoMaterno: teacher.apellidoMaterno,
      departamento: teacher.departamento,
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
 * Get teacher by ID
 */
export const getTeacherById = async (
  id: string
): Promise<TeacherResponseDto> => {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
  });

  if (!teacher) {
    throw new Error('Teacher not found');
  }

  return {
    id: teacher.id,
    userId: teacher.userId,
    nombre: teacher.nombre,
    apellidoPaterno: teacher.apellidoPaterno,
    apellidoMaterno: teacher.apellidoMaterno,
    departamento: teacher.departamento,
  };
};

/**
 * Update teacher information
 */
export const updateTeacher = async (
  id: string,
  data: UpdateTeacherDto
): Promise<TeacherResponseDto> => {
  // Check if teacher exists
  const existingTeacher = await prisma.teacher.findUnique({
    where: { id },
  });

  if (!existingTeacher) {
    throw new Error('Teacher not found');
  }

  // Build update data (only include provided fields)
  const updateData: Record<string, unknown> = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.apellidoPaterno !== undefined)
    updateData.apellidoPaterno = data.apellidoPaterno;
  if (data.apellidoMaterno !== undefined)
    updateData.apellidoMaterno = data.apellidoMaterno;
  if (data.departamento !== undefined) updateData.departamento = data.departamento;

  const teacher = await prisma.teacher.update({
    where: { id },
    data: updateData,
  });

  return {
    id: teacher.id,
    userId: teacher.userId,
    nombre: teacher.nombre,
    apellidoPaterno: teacher.apellidoPaterno,
    apellidoMaterno: teacher.apellidoMaterno,
    departamento: teacher.departamento,
  };
};

/**
 * Delete a teacher and associated user
 * Cannot delete if teacher has groups assigned (onDelete: Restrict)
 * ADMIN only
 */
export const deleteTeacher = async (id: string): Promise<void> => {
  // Check if teacher exists
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      groups: {
        select: { id: true },
      },
    },
  });

  if (!teacher) {
    throw new Error('Teacher not found');
  }

  // Check if teacher has groups assigned
  if (teacher.groups.length > 0) {
    throw new Error(
      `Cannot delete teacher: ${teacher.nombre} ${teacher.apellidoPaterno}. Teacher has ${teacher.groups.length} group(s) assigned. Please reassign or delete groups first.`
    );
  }

  // Delete teacher (this will cascade delete user due to onDelete: Cascade)
  await prisma.teacher.delete({
    where: { id },
  });

  // User is automatically deleted due to cascade relationship
};


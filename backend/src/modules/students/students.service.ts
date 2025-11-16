// Students service - Business logic for student management
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentQueryDto,
  StudentResponseDto,
  StudentMeResponseDto,
  StudentsListResponseDto,
} from './students.dtos';

/**
 * Create a new student with associated user account
 */
export const createStudent = async (
  data: CreateStudentDto
): Promise<StudentResponseDto> => {
  const { user: userData, student: studentData } = data;

  // Check if username already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: userData.username },
  });

  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Check if matricula already exists
  const existingMatricula = await prisma.student.findUnique({
    where: { matricula: studentData.matricula },
  });

  if (existingMatricula) {
    throw new Error('Matrícula already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, 10);

  // Create user and student in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        username: userData.username,
        passwordHash,
        role: 'STUDENT',
      },
    });

    // Create student
    const student = await tx.student.create({
      data: {
        userId: user.id,
        matricula: studentData.matricula,
        nombre: studentData.nombre,
        apellidoPaterno: studentData.apellidoPaterno,
        apellidoMaterno: studentData.apellidoMaterno,
        carrera: studentData.carrera,
        semestre: studentData.semestre,
        estatus: studentData.estatus,
      },
    });

    return { user, student };
  });

  return {
    id: result.student.id,
    userId: result.student.userId,
    matricula: result.student.matricula,
    nombre: result.student.nombre,
    apellidoPaterno: result.student.apellidoPaterno,
    apellidoMaterno: result.student.apellidoMaterno,
    carrera: result.student.carrera,
    semestre: result.student.semestre,
    estatus: result.student.estatus,
    user: {
      id: result.user.id,
      username: result.user.username,
      role: 'STUDENT',
      createdAt: result.user.createdAt.toISOString(),
      updatedAt: result.user.updatedAt.toISOString(),
    },
  };
};

/**
 * Get all students with optional filters and pagination
 */
export const getAllStudents = async (
  query: StudentQueryDto
): Promise<StudentsListResponseDto> => {
  const {
    matricula,
    carrera,
    semestre,
    estatus,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    curp,
    page = 1,
    limit = 20,
    sortBy = 'nombre',
    sortOrder = 'asc',
  } = query;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (matricula) {
    where.matricula = { contains: matricula };
  }
  if (carrera) {
    where.carrera = { contains: carrera };
  }
  if (semestre !== undefined) {
    where.semestre = semestre;
  }
  if (estatus) {
    where.estatus = estatus;
  }
  if (nombre) {
    where.nombre = { contains: nombre };
  }
  if (apellidoPaterno) {
    where.apellidoPaterno = { contains: apellidoPaterno };
  }
  if (apellidoMaterno) {
    where.apellidoMaterno = { contains: apellidoMaterno };
  }
  if (curp) {
    where.curp = { contains: curp };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Build orderBy clause
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortOrder;

  // Get total count
  const total = await prisma.student.count({ where });

  // Get students
  const students = await prisma.student.findMany({
    where,
    skip,
    take,
    orderBy,
  });

  return {
    students: students.map((student) => ({
      id: student.id,
      userId: student.userId,
      matricula: student.matricula,
      nombre: student.nombre,
      apellidoPaterno: student.apellidoPaterno,
      apellidoMaterno: student.apellidoMaterno,
      carrera: student.carrera,
      semestre: student.semestre,
      estatus: student.estatus,
      curp: student.curp || undefined,
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
 * Get student by ID
 */
export const getStudentById = async (
  id: string
): Promise<StudentResponseDto> => {
  const student = await prisma.student.findUnique({
    where: { id },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  return {
    id: student.id,
    userId: student.userId,
    matricula: student.matricula,
    nombre: student.nombre,
    apellidoPaterno: student.apellidoPaterno,
    apellidoMaterno: student.apellidoMaterno,
    carrera: student.carrera,
    semestre: student.semestre,
    estatus: student.estatus,
    curp: student.curp || undefined,
  };
};

/**
 * Delete a student and associated user
 * Also deletes all enrollments (cascade)
 * ADMIN only
 */
export const deleteStudent = async (id: string): Promise<void> => {
  // Check if student exists
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        select: { id: true },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Delete student (this will cascade delete enrollments due to onDelete: Cascade)
  // Then delete the associated user (onDelete: Cascade handles this)
  await prisma.student.delete({
    where: { id },
  });

  // User is automatically deleted due to cascade relationship
};

/**
 * Update student information
 */
export const updateStudent = async (
  id: string,
  data: UpdateStudentDto
): Promise<StudentResponseDto> => {
  // Check if student exists
  const existingStudent = await prisma.student.findUnique({
    where: { id },
  });

  if (!existingStudent) {
    throw new Error('Student not found');
  }

  // Build update data (only include provided fields)
  const updateData: Record<string, unknown> = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.apellidoPaterno !== undefined)
    updateData.apellidoPaterno = data.apellidoPaterno;
  if (data.apellidoMaterno !== undefined)
    updateData.apellidoMaterno = data.apellidoMaterno;
  if (data.carrera !== undefined) updateData.carrera = data.carrera;
  if (data.semestre !== undefined) updateData.semestre = data.semestre;
  if (data.estatus !== undefined) updateData.estatus = data.estatus;
  if (data.curp !== undefined) updateData.curp = data.curp;

  const student = await prisma.student.update({
    where: { id },
    data: updateData,
  });

  return {
    id: student.id,
    userId: student.userId,
    matricula: student.matricula,
    nombre: student.nombre,
    apellidoPaterno: student.apellidoPaterno,
    apellidoMaterno: student.apellidoMaterno,
    carrera: student.carrera,
    semestre: student.semestre,
    estatus: student.estatus,
  };
};

/**
 * Get student by user ID (for /me endpoint)
 */
export const getStudentByUserId = async (
  userId: string
): Promise<StudentMeResponseDto> => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  return {
    id: student.id,
    userId: student.userId,
    matricula: student.matricula,
    nombre: student.nombre,
    apellidoPaterno: student.apellidoPaterno,
    apellidoMaterno: student.apellidoMaterno,
    carrera: student.carrera,
    semestre: student.semestre,
    estatus: student.estatus,
    user: {
      id: student.user.id,
      username: student.user.username,
      role: student.user.role as 'STUDENT',
      createdAt: student.user.createdAt.toISOString(),
      updatedAt: student.user.updatedAt.toISOString(),
    },
  };
};


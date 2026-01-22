// Teachers service - Business logic for teacher management
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import {
  CreateTeacherDto,
  UpdateTeacherDto,
  TeacherQueryDto,
  TeacherResponseDto,
  TeachersListResponseDto,
} from './teachers.dtos';
import { TeacherValidators } from './teachers.validators';

/**
 * Helper function to map Prisma teacher to response DTO
 */
const mapTeacherToResponseDto = (teacher: any): TeacherResponseDto => {
  return {
    id: teacher.id,
    userId: teacher.userId,
    nombre: teacher.nombre,
    apellidoPaterno: teacher.apellidoPaterno,
    apellidoMaterno: teacher.apellidoMaterno,
    departamento: teacher.departamento,
    // Contact information
    email: teacher.email || undefined,
    telefono: teacher.telefono || undefined,
    // Personal information
    fechaNacimiento: teacher.fechaNacimiento ? teacher.fechaNacimiento.toISOString() : undefined,
    genero: teacher.genero || undefined,
    nacionalidad: teacher.nacionalidad || undefined,
    lugarNacimiento: teacher.lugarNacimiento || undefined,
    direccion: teacher.direccion || undefined,
    ciudad: teacher.ciudad || undefined,
    estado: teacher.estado || undefined,
    codigoPostal: teacher.codigoPostal || undefined,
    pais: teacher.pais || undefined,
    // Academic information
    gradoAcademico: teacher.gradoAcademico || undefined,
    especialidad: teacher.especialidad || undefined,
    cedulaProfesional: teacher.cedulaProfesional || undefined,
    universidad: teacher.universidad || undefined,
    // Employment information
    tipoContrato: teacher.tipoContrato || undefined,
    fechaContratacion: teacher.fechaContratacion ? teacher.fechaContratacion.toISOString() : undefined,
    estatus: teacher.estatus || undefined,
    salario: teacher.salario ? Number(teacher.salario) : undefined,
    gruposAsignados: teacher.gruposAsignados || undefined,
    estudiantesTotal: teacher.estudiantesTotal || undefined,
    observaciones: teacher.observaciones || undefined,
  };
};

/**
 * Create a new teacher with associated user account
 */
export const createTeacher = async (
  data: CreateTeacherDto
): Promise<TeacherResponseDto> => {
  const { user: userData, teacher: teacherData } = data;

  // Apply business rule validations using validators
  await TeacherValidators.validateUsernameUnique(userData.username);

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, 10);

  // Generate UUIDs
  const userId = randomUUID();
  const teacherId = randomUUID();
  const now = new Date();

  // Create user and teacher in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.users.create({
      data: {
        id: userId,
        username: userData.username,
        passwordHash,
        role: 'TEACHER',
        createdAt: now,
        updatedAt: now,
      } as any, // Type assertion needed for Prisma Client types
    });

    // Create teacher with optional fields
    const teacher = await tx.teachers.create({
      data: {
        id: teacherId,
        userId: user.id,
        nombre: teacherData.nombre,
        apellidoPaterno: teacherData.apellidoPaterno,
        apellidoMaterno: teacherData.apellidoMaterno,
        departamento: teacherData.departamento,
        // Optional contact information
        email: teacherData.email,
        telefono: teacherData.telefono,
        // Optional personal information
        fechaNacimiento: teacherData.fechaNacimiento ? new Date(teacherData.fechaNacimiento) : undefined,
        genero: teacherData.genero,
        nacionalidad: teacherData.nacionalidad,
        lugarNacimiento: teacherData.lugarNacimiento,
        direccion: teacherData.direccion,
        ciudad: teacherData.ciudad,
        estado: teacherData.estado,
        codigoPostal: teacherData.codigoPostal,
        pais: teacherData.pais,
        // Optional academic information
        gradoAcademico: teacherData.gradoAcademico,
        especialidad: teacherData.especialidad,
        cedulaProfesional: teacherData.cedulaProfesional,
        universidad: teacherData.universidad,
        // Optional employment information
        tipoContrato: teacherData.tipoContrato,
        fechaContratacion: teacherData.fechaContratacion ? new Date(teacherData.fechaContratacion) : undefined,
        estatus: teacherData.estatus,
        salario: teacherData.salario,
        createdAt: now,
        updatedAt: now,
      } as any, // Type assertion needed for Prisma Client types
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
  const total = await prisma.teachers.count({ where });

  // Get teachers
  const teachers = await prisma.teachers.findMany({
    where,
    skip,
    take,
    orderBy,
  });

  return {
    teachers: teachers.map((teacher) => mapTeacherToResponseDto(teacher)),
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
  // Validate that teacher exists
  await TeacherValidators.validateTeacherExists(id);

  const teacher = await prisma.teachers.findUnique({
    where: { id },
  });

  return mapTeacherToResponseDto(teacher!);
};

/**
 * Update teacher information
 */
export const updateTeacher = async (
  id: string,
  data: UpdateTeacherDto
): Promise<TeacherResponseDto> => {
  // Validate that teacher exists
  await TeacherValidators.validateTeacherExists(id);

  const existingTeacher = await prisma.teachers.findUnique({
    where: { id },
  });

  // Build update data (only include provided fields that exist in DB schema)
  const updateData: Record<string, unknown> = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.apellidoPaterno !== undefined)
    updateData.apellidoPaterno = data.apellidoPaterno;
  if (data.apellidoMaterno !== undefined)
    updateData.apellidoMaterno = data.apellidoMaterno;
  if (data.departamento !== undefined) updateData.departamento = data.departamento;
  // Contact information
  if (data.email !== undefined) updateData.email = data.email;
  if (data.telefono !== undefined) updateData.telefono = data.telefono;
  // Personal information
  if (data.fechaNacimiento !== undefined) updateData.fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : null;
  if (data.genero !== undefined) updateData.genero = data.genero;
  if (data.nacionalidad !== undefined) updateData.nacionalidad = data.nacionalidad;
  if (data.lugarNacimiento !== undefined) updateData.lugarNacimiento = data.lugarNacimiento;
  if (data.direccion !== undefined) updateData.direccion = data.direccion;
  if (data.ciudad !== undefined) updateData.ciudad = data.ciudad;
  if (data.estado !== undefined) updateData.estado = data.estado;
  if (data.codigoPostal !== undefined) updateData.codigoPostal = data.codigoPostal;
  if (data.pais !== undefined) updateData.pais = data.pais;
  // Academic information
  if (data.gradoAcademico !== undefined) updateData.gradoAcademico = data.gradoAcademico;
  if (data.especialidad !== undefined) updateData.especialidad = data.especialidad;
  if (data.cedulaProfesional !== undefined) updateData.cedulaProfesional = data.cedulaProfesional;
  if (data.universidad !== undefined) updateData.universidad = data.universidad;
  // Employment information
  if (data.tipoContrato !== undefined) updateData.tipoContrato = data.tipoContrato;
  if (data.fechaContratacion !== undefined) updateData.fechaContratacion = data.fechaContratacion ? new Date(data.fechaContratacion) : null;
  if (data.estatus !== undefined) updateData.estatus = data.estatus;
  if (data.salario !== undefined) updateData.salario = data.salario;
  if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

  // Si no hay cambios efectivos, regresar el teacher existente sin tocar la BD
  if (Object.keys(updateData).length === 0) {
    return mapTeacherToResponseDto(existingTeacher!);
  }

  const teacher = await prisma.teachers.update({
    where: { id },
    data: updateData,
  });

  return mapTeacherToResponseDto(teacher);
};

/**
 * Delete a teacher and associated user
 * Cannot delete if teacher has groups assigned (onDelete: Restrict)
 * ADMIN only
 */
export const deleteTeacher = async (id: string): Promise<void> => {
  // Validate that teacher can be deleted (exists and has no groups)
  await TeacherValidators.validateTeacherCanBeDeleted(id);

  // Delete teacher (this will cascade delete user due to onDelete: Cascade)
  await prisma.teachers.delete({
    where: { id },
  });

  // User is automatically deleted due to cascade relationship
};


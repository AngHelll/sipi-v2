// Students service - Business logic for student management
import { randomUUID } from 'node:crypto';
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
import { StudentValidators, StudentCalculators } from './students.validators';

/**
 * Helper function to map Prisma student to response DTO
 */
const mapStudentToResponseDto = (student: any): StudentResponseDto => {
  return {
    id: student.id,
    userId: student.userId,
    matricula: student.matricula,
    nombre: student.nombre,
    apellidoPaterno: student.apellidoPaterno,
    apellidoMaterno: student.apellidoMaterno,
    carrera: student.carrera,
    carreraId: student.carreraId || undefined,
    semestre: student.semestre,
    estatus: student.estatus,
    curp: student.curp || undefined,
    // Contact information
    email: student.email || undefined,
    telefono: student.telefono || undefined,
    telefonoEmergencia: student.telefonoEmergencia || undefined,
    // Personal information
    fechaNacimiento: student.fechaNacimiento ? student.fechaNacimiento.toISOString() : undefined,
    genero: student.genero || undefined,
    nacionalidad: student.nacionalidad || undefined,
    lugarNacimiento: student.lugarNacimiento || undefined,
    direccion: student.direccion || undefined,
    ciudad: student.ciudad || undefined,
    estado: student.estado || undefined,
    codigoPostal: student.codigoPostal || undefined,
    pais: student.pais || undefined,
    // Academic information
    tipoIngreso: student.tipoIngreso || undefined,
    fechaIngreso: student.fechaIngreso ? student.fechaIngreso.toISOString() : undefined,
    fechaEgreso: student.fechaEgreso ? student.fechaEgreso.toISOString() : undefined,
    promedioGeneral: student.promedioGeneral ? Number(student.promedioGeneral) : undefined,
    promedioIngles: student.promedioIngles ? Number(student.promedioIngles) : undefined,
    creditosCursados: student.creditosCursados || undefined,
    creditosAprobados: student.creditosAprobados || undefined,
    creditosTotales: student.creditosTotales || undefined,
    // Administrative information
    beca: student.beca || undefined,
    tipoBeca: student.tipoBeca || undefined,
    observaciones: student.observaciones || undefined,
    // RB-038: Información de inglés del estudiante
    nivelInglesActual: student.nivelInglesActual || undefined,
    nivelInglesCertificado: student.nivelInglesCertificado || undefined,
    fechaExamenDiagnostico: student.fechaExamenDiagnostico ? student.fechaExamenDiagnostico.toISOString() : undefined,
    porcentajeIngles: student.porcentajeIngles ? Number(student.porcentajeIngles) : undefined,
    cumpleRequisitoIngles: student.cumpleRequisitoIngles || undefined,
  };
};

/**
 * Create a new student with associated user account
 */
export const createStudent = async (
  data: CreateStudentDto
): Promise<StudentResponseDto> => {
  const { user: userData, student: studentData } = data;

  // Apply business rule validations using validators
  await StudentValidators.validateUsernameUnique(userData.username);
  await StudentValidators.validateMatriculaUnique(studentData.matricula);

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, 10);

  // Generate UUIDs
  const userId = randomUUID();
  const studentId = randomUUID();
  const now = new Date();

  // Create user and student in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.users.create({
      data: {
        id: userId,
        username: userData.username,
        passwordHash,
        role: 'STUDENT',
        createdAt: now,
        updatedAt: now,
      } as any, // Type assertion needed for Prisma Client types
    });

    // Create student
    const student = await tx.students.create({
      data: {
        id: studentId,
        userId: user.id,
        matricula: studentData.matricula,
        nombre: studentData.nombre,
        apellidoPaterno: studentData.apellidoPaterno,
        apellidoMaterno: studentData.apellidoMaterno,
        carrera: studentData.carrera,
        semestre: studentData.semestre,
        estatus: studentData.estatus,
        createdAt: now,
        updatedAt: now,
      } as any, // Type assertion needed for Prisma Client types
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
  const total = await prisma.students.count({ where });

  // Get students
  const students = await prisma.students.findMany({
    where,
    skip,
    take,
    orderBy,
  });

  return {
    students: students.map((student) => mapStudentToResponseDto(student)),
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
  const student = await prisma.students.findUnique({
    where: { id },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  return mapStudentToResponseDto(student);
};

/**
 * Delete a student and associated user
 * Also deletes all enrollments (cascade)
 * ADMIN only
 */
export const deleteStudent = async (id: string): Promise<void> => {
  // Check if student exists
  const student = await prisma.students.findUnique({
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
  await prisma.students.delete({
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
  const existingStudent = await prisma.students.findUnique({
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
  // Contact information
  if (data.email !== undefined) updateData.email = data.email;
  if (data.telefono !== undefined) updateData.telefono = data.telefono;
  if (data.telefonoEmergencia !== undefined) updateData.telefonoEmergencia = data.telefonoEmergencia;
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
  if (data.tipoIngreso !== undefined) updateData.tipoIngreso = data.tipoIngreso;
  if (data.fechaIngreso !== undefined) updateData.fechaIngreso = data.fechaIngreso ? new Date(data.fechaIngreso) : null;
  if (data.fechaEgreso !== undefined) updateData.fechaEgreso = data.fechaEgreso ? new Date(data.fechaEgreso) : null;
  if (data.promedioGeneral !== undefined) updateData.promedioGeneral = data.promedioGeneral;
  if (data.promedioIngles !== undefined) updateData.promedioIngles = data.promedioIngles;
  if (data.creditosCursados !== undefined) updateData.creditosCursados = data.creditosCursados;
  if (data.creditosAprobados !== undefined) updateData.creditosAprobados = data.creditosAprobados;
  if (data.creditosTotales !== undefined) updateData.creditosTotales = data.creditosTotales;
  // Administrative information
  if (data.beca !== undefined) updateData.beca = data.beca;
  if (data.tipoBeca !== undefined) updateData.tipoBeca = data.tipoBeca;
  if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;
  if (data.carreraId !== undefined) updateData.carreraId = data.carreraId;

  const student = await prisma.students.update({
    where: { id },
    data: updateData,
  });

  return mapStudentToResponseDto(student);
};

/**
 * Get student by user ID (for /me endpoint)
 */
export const getStudentByUserId = async (
  userId: string
): Promise<StudentMeResponseDto> => {
  const student = await prisma.students.findUnique({
    where: { userId },
    include: {
      users: {
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
    ...mapStudentToResponseDto(student),
    user: {
      id: student.users.id,
      username: student.users.username,
      role: student.users.role as 'STUDENT',
      createdAt: student.users.createdAt.toISOString(),
      updatedAt: student.users.updatedAt.toISOString(),
    },
  };
};

/**
 * RB-037: Recalculate student averages (promedioGeneral and promedioIngles)
 * 
 * This function should be called whenever enrollments are created, updated, or deleted
 * to keep student averages in sync.
 * 
 * @param studentId - ID of the student to recalculate averages for
 */
export const recalculateStudentAverages = async (studentId: string): Promise<void> => {
  // Get all enrollments for this student with grades and subject information
  const enrollments = await prisma.enrollments.findMany({
    where: {
      studentId,
      deletedAt: null,
    },
    include: {
      groups: {
        include: {
          subjects: {
            select: {
              id: true,
              clave: true,
              nombre: true,
            },
          },
        },
      },
    },
  });  // Prepare enrollments data for calculators
  const enrollmentsData = enrollments.map((enrollment) => ({
    calificacionFinal: enrollment.calificacionFinal ? Number(enrollment.calificacionFinal) : null,
    calificacion: enrollment.calificacion ? Number(enrollment.calificacion) : null,
    group: {
      subject: enrollment.groups.subjects ? {
        clave: enrollment.groups.subjects.clave,
        nombre: enrollment.groups.subjects.nombre,
      } : null,
    },
  }));

  // Calculate promedioGeneral from enrollments (excluding English)
  const promedioGeneral = StudentCalculators.calculatePromedioGeneral(enrollmentsData);
  
  // Calculate promedioIngles from V2 special_courses (English courses)
  // Only include APPROVED courses with grades (all completed levels)
  const englishCourses = await (prisma as any).academic_activities.findMany({
    where: {
      studentId,
      activityType: 'SPECIAL_COURSE',
      deletedAt: null,
      estatus: 'APROBADO', // Only approved/completed courses
      special_courses: {
        courseType: 'INGLES',
        calificacion: { not: null }, // Must have a grade
      },
    },
    include: {
      special_courses: {
        select: {
          calificacion: true,
          nivelIngles: true,
        },
      },
    },
  });

  let promedioIngles: number | undefined = undefined;
  if (englishCourses.length > 0) {
    // Get all grades from approved English courses (all completed levels)
    const grades = englishCourses
      .map((activity: any) => {
        const grade = activity.special_courses?.calificacion;
        return grade !== null && grade !== undefined ? Number(grade) : null;
      })
      .filter((grade: number | null): grade is number => grade !== null);
    
    if (grades.length > 0) {
      const sum = grades.reduce((acc: number, grade: number) => acc + grade, 0);
      promedioIngles = Math.round((sum / grades.length) * 100) / 100;
    }
  }

  // If no V2 courses, fallback to legacy enrollments calculation
  if (promedioIngles === undefined) {
    promedioIngles = StudentCalculators.calculatePromedioIngles(enrollmentsData);
  }

  // Calculate English requirement status (considers average AND completed levels)
  const englishRequirementStatus = await StudentCalculators.calculateEnglishRequirementStatus(studentId);

  // Update student record
  await prisma.students.update({
    where: { id: studentId },
    data: {
      promedioGeneral: promedioGeneral !== undefined ? promedioGeneral : null,
      promedioIngles: promedioIngles !== undefined ? promedioIngles : null,
      // Update cumpleRequisitoIngles based on complete requirement status
      cumpleRequisitoIngles: englishRequirementStatus.cumpleRequisitoIngles,
    },
  });
};

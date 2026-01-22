// Enrollments service - Business logic for enrollment management
import { randomUUID } from 'crypto';
import prisma from '../../config/database';
import { recalculateStudentAverages } from '../students/students.service';
import { Prisma } from '@prisma/client';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  EnrollmentResponseDto,
  EnrollmentsListResponseDto,
} from './enrollments.dtos';
import { EnrollmentValidators, EnrollmentCalculators } from './enrollments.validators';

/**
 * Helper function to map Prisma enrollment to response DTO
 */
export const mapEnrollmentToResponseDto = (enrollment: any): EnrollmentResponseDto => {
  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    groupId: enrollment.groupId,
    calificacion: enrollment.calificacion ? Number(enrollment.calificacion) : null,
    // New fields (Phase 2)
    codigo: enrollment.codigo || undefined,
    fechaInscripcion: enrollment.fechaInscripcion ? enrollment.fechaInscripcion.toISOString() : undefined,
    fechaBaja: enrollment.fechaBaja ? enrollment.fechaBaja.toISOString() : undefined,
    tipoInscripcion: enrollment.tipoInscripcion || undefined,
    estatus: enrollment.estatus || undefined,
    // Partial grades
    calificacionParcial1: enrollment.calificacionParcial1 ? Number(enrollment.calificacionParcial1) : undefined,
    calificacionParcial2: enrollment.calificacionParcial2 ? Number(enrollment.calificacionParcial2) : undefined,
    calificacionParcial3: enrollment.calificacionParcial3 ? Number(enrollment.calificacionParcial3) : undefined,
    calificacionFinal: enrollment.calificacionFinal ? Number(enrollment.calificacionFinal) : undefined,
    calificacionExtra: enrollment.calificacionExtra ? Number(enrollment.calificacionExtra) : undefined,
    // Attendance
    asistencias: enrollment.asistencias || undefined,
    faltas: enrollment.faltas || undefined,
    retardos: enrollment.retardos || undefined,
    porcentajeAsistencia: enrollment.porcentajeAsistencia ? Number(enrollment.porcentajeAsistencia) : undefined,
    // Evaluation
    aprobado: enrollment.aprobado !== null && enrollment.aprobado !== undefined ? enrollment.aprobado : undefined,
    fechaAprobacion: enrollment.fechaAprobacion ? enrollment.fechaAprobacion.toISOString() : undefined,
    observaciones: enrollment.observaciones || undefined,
    // RB-038: English enrollment fields
    nivelIngles: enrollment.nivelIngles !== null && enrollment.nivelIngles !== undefined ? enrollment.nivelIngles : undefined,
    esExamenDiagnostico: enrollment.esExamenDiagnostico !== null && enrollment.esExamenDiagnostico !== undefined ? enrollment.esExamenDiagnostico : undefined,
    requierePago: enrollment.requierePago !== null && enrollment.requierePago !== undefined ? enrollment.requierePago : undefined,
    pagoAprobado: enrollment.pagoAprobado !== null && enrollment.pagoAprobado !== undefined ? enrollment.pagoAprobado : undefined,
    fechaPagoAprobado: enrollment.fechaPagoAprobado ? enrollment.fechaPagoAprobado.toISOString() : undefined,
    montoPago: enrollment.montoPago ? Number(enrollment.montoPago) : undefined,
    comprobantePago: enrollment.comprobantePago || undefined,
  };
};

/**
 * Get enrollments for the current student (GET /api/enrollments/me)
 * Returns all enrollments for the authenticated student with full group and subject information
 */
export const getEnrollmentsMe = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<EnrollmentsListResponseDto> => {
  // Find student record for this user
  const student = await prisma.students.findUnique({
    where: { userId },
  });

  if (!student) {
    // Student not found, return empty result
    return {
      enrollments: [],
      pagination: {
        page,
        limit: Math.min(limit, 100),
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Get total count
  const total = await prisma.enrollments.count({
    where: { studentId: student.id },
  });

  // Get enrollments with related data
  const enrollments = await prisma.enrollments.findMany({
    where: { studentId: student.id },
    skip,
    take,
    orderBy: { id: 'desc' }, // Order by id since createdAt doesn't exist
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
          semestre: true,
          estatus: true,
        },
      },
      groups: {
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
      },
    },
  });

  return {
    enrollments: enrollments.map((enrollment) => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      groupId: enrollment.groupId,
      calificacion: enrollment.calificacion ? enrollment.calificacion.toNumber() : null,
      student: {
        id: enrollment.students.id,
        matricula: enrollment.students.matricula,
        nombre: enrollment.students.nombre,
        apellidoPaterno: enrollment.students.apellidoPaterno,
        apellidoMaterno: enrollment.students.apellidoMaterno,
        carrera: enrollment.students.carrera,
        semestre: enrollment.students.semestre,
        estatus: enrollment.students.estatus,
      },
      group: {
        id: enrollment.groups.id,
        nombre: enrollment.groups.nombre,
        periodo: enrollment.groups.periodo,
        subject: {
          id: enrollment.groups.subjects.id,
          clave: enrollment.groups.subjects.clave,
          nombre: enrollment.groups.subjects.nombre,
          creditos: enrollment.groups.subjects.creditos,
        },
        teacher: {
          id: enrollment.groups.teachers.id,
          nombre: enrollment.groups.teachers.nombre,
          apellidoPaterno: enrollment.groups.teachers.apellidoPaterno,
          apellidoMaterno: enrollment.groups.teachers.apellidoMaterno,
          departamento: enrollment.groups.teachers.departamento,
        },
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
 * Get all enrollments (ADMIN only)
 * Returns all enrollments with optional filters and pagination
 */
export const getAllEnrollments = async (
  query: {
    page?: number;
    limit?: number;
    studentId?: string;
    groupId?: string;
    estatus?: string;
    tipoInscripcion?: string;
    aprobado?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<EnrollmentsListResponseDto> => {
  const {
    page = 1,
    limit = 20,
    studentId,
    groupId,
    estatus,
    tipoInscripcion,
    aprobado,
    sortBy = 'fechaInscripcion',
    sortOrder = 'desc',
  } = query;

  // Build where clause
  const where: Record<string, unknown> = {};
  
  if (studentId) {
    where.studentId = studentId;
  }
  if (groupId) {
    where.groupId = groupId;
  }
  if (estatus) {
    where.estatus = estatus;
  }
  if (tipoInscripcion) {
    where.tipoInscripcion = tipoInscripcion;
  }
  if (aprobado !== undefined) {
    where.aprobado = aprobado;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Build orderBy clause
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortOrder;

  // Get total count
  const total = await prisma.enrollments.count({ where });

  // Get enrollments with related data
  const enrollments = await prisma.enrollments.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
          semestre: true,
          estatus: true,
        },
      },
      groups: {
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
      },
    },
  });

  return {
    enrollments: enrollments.map((enrollment) => ({
      ...mapEnrollmentToResponseDto(enrollment),
      student: {
        id: enrollment.students.id,
        matricula: enrollment.students.matricula,
        nombre: enrollment.students.nombre,
        apellidoPaterno: enrollment.students.apellidoPaterno,
        apellidoMaterno: enrollment.students.apellidoMaterno,
        carrera: enrollment.students.carrera,
        semestre: enrollment.students.semestre,
        estatus: enrollment.students.estatus,
      },
      group: {
        id: enrollment.groups.id,
        nombre: enrollment.groups.nombre,
        periodo: enrollment.groups.periodo,
        subject: {
          id: enrollment.groups.subjects.id,
          clave: enrollment.groups.subjects.clave,
          nombre: enrollment.groups.subjects.nombre,
          creditos: enrollment.groups.subjects.creditos,
        },
        teacher: {
          id: enrollment.groups.teachers.id,
          nombre: enrollment.groups.teachers.nombre,
          apellidoPaterno: enrollment.groups.teachers.apellidoPaterno,
          apellidoMaterno: enrollment.groups.teachers.apellidoMaterno,
          departamento: enrollment.groups.teachers.departamento,
        },
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
 * Get enrollment by ID
 * ADMIN can access any enrollment
 * TEACHER can only access enrollments for their own groups
 * STUDENT can only access their own enrollments
 * 
 * This function searches in:
 * 1. Legacy enrollments table
 * 2. V2 enrollments (academic_activities with enrollments_v2)
 * 3. Special courses (academic_activities with special_courses)
 */
export const getEnrollmentById = async (
  id: string,
  userId?: string,
  userRole?: string
): Promise<EnrollmentResponseDto | null> => {
  // First, try legacy enrollments table
  let enrollment = await prisma.enrollments.findUnique({
    where: { id },
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
          semestre: true,
          estatus: true,
        },
      },
      groups: {
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
      },
    },
  });

  // If not found in legacy, try academic_activities (V2 enrollments or special courses)
  if (!enrollment) {
    const activity = await (prisma as any).academic_activities.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            matricula: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            carrera: true,
            semestre: true,
            estatus: true,
          },
        },
        enrollments_v2: {
          include: {
            groups: {
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
            },
          },
        },
        special_courses: {
          include: {
            groups: {
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
            },
          },
        },
      },
    });

    if (!activity) {
      return null;
    }

    // Map activity to enrollment format
    const group = activity.enrollments_v2?.groups || activity.special_courses?.groups;
    
    if (!group) {
      return null;
    }

    // Role-based access control for activities
    if (userRole === 'STUDENT' && userId) {
      const student = await prisma.students.findUnique({
        where: { userId },
      });

      if (!student || activity.studentId !== student.id) {
        throw new Error('You can only view your own enrollments');
      }
    } else if (userRole === 'TEACHER' && userId) {
      const teacher = await prisma.teachers.findUnique({
        where: { userId },
      });

      if (!teacher || group.teacherId !== teacher.id) {
        throw new Error('You can only view enrollments for your own groups');
      }
    }

    // Map special course or V2 enrollment to EnrollmentResponseDto format
    if (activity.enrollments_v2) {
      // V2 enrollment
      const enrollmentData: EnrollmentResponseDto = {
        id: activity.id,
        studentId: activity.studentId,
        groupId: activity.enrollments_v2.groupId,
        calificacion: activity.enrollments_v2.calificacion ? activity.enrollments_v2.calificacion.toNumber() : null,
        calificacionFinal: activity.enrollments_v2.calificacionFinal ? activity.enrollments_v2.calificacionFinal.toNumber() : null,
        calificacionParcial1: activity.enrollments_v2.calificacionParcial1 ? activity.enrollments_v2.calificacionParcial1.toNumber() : null,
        calificacionParcial2: activity.enrollments_v2.calificacionParcial2 ? activity.enrollments_v2.calificacionParcial2.toNumber() : null,
        calificacionParcial3: activity.enrollments_v2.calificacionParcial3 ? activity.enrollments_v2.calificacionParcial3.toNumber() : null,
        calificacionExtra: activity.enrollments_v2.calificacionExtra ? activity.enrollments_v2.calificacionExtra.toNumber() : null,
        estatus: activity.estatus,
        tipoInscripcion: activity.enrollments_v2.tipoInscripcion || 'NORMAL',
        fechaInscripcion: activity.fechaInscripcion ? activity.fechaInscripcion.toISOString() : undefined,
        porcentajeAsistencia: activity.enrollments_v2.porcentajeAsistencia ? activity.enrollments_v2.porcentajeAsistencia.toNumber() : undefined,
        asistencias: activity.enrollments_v2.asistencias || 0,
        faltas: activity.enrollments_v2.faltas || 0,
        retardos: activity.enrollments_v2.retardos || 0,
        aprobado: activity.enrollments_v2.aprobado || false,
        fechaAprobacion: activity.enrollments_v2.fechaAprobacion ? activity.enrollments_v2.fechaAprobacion.toISOString() : undefined,
        observaciones: activity.observaciones || undefined,
        student: {
          id: activity.students.id,
          matricula: activity.students.matricula,
          nombre: activity.students.nombre,
          apellidoPaterno: activity.students.apellidoPaterno,
          apellidoMaterno: activity.students.apellidoMaterno,
          carrera: activity.students.carrera,
          semestre: activity.students.semestre,
          estatus: activity.students.estatus,
        },
        group: {
          id: group.id,
          nombre: group.nombre,
          periodo: group.periodo,
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
        },
      };
      return enrollmentData;
    } else if (activity.special_courses) {
      // Special course (English course)
      const enrollmentData: EnrollmentResponseDto = {
        id: activity.id,
        studentId: activity.studentId,
        groupId: activity.special_courses.groupId || null,
        calificacion: activity.special_courses.calificacion ? activity.special_courses.calificacion.toNumber() : null,
        calificacionFinal: activity.special_courses.calificacion ? activity.special_courses.calificacion.toNumber() : null,
        calificacionParcial1: undefined,
        calificacionParcial2: undefined,
        calificacionParcial3: undefined,
        calificacionExtra: undefined,
        estatus: activity.estatus,
        tipoInscripcion: 'CURSO_INGLES',
        fechaInscripcion: activity.fechaInscripcion ? activity.fechaInscripcion.toISOString() : undefined,
        porcentajeAsistencia: undefined,
        asistencias: 0,
        faltas: 0,
        retardos: 0,
        aprobado: activity.special_courses.aprobado || false,
        fechaAprobacion: activity.special_courses.fechaAprobacion ? activity.special_courses.fechaAprobacion.toISOString() : undefined,
        observaciones: activity.observaciones || undefined,
        student: {
          id: activity.students.id,
          matricula: activity.students.matricula,
          nombre: activity.students.nombre,
          apellidoPaterno: activity.students.apellidoPaterno,
          apellidoMaterno: activity.students.apellidoMaterno,
          carrera: activity.students.carrera,
          semestre: activity.students.semestre,
          estatus: activity.students.estatus,
        },
        group: group ? {
          id: group.id,
          nombre: group.nombre,
          periodo: group.periodo,
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
        } : undefined,
      };
      return enrollmentData;
    }

    return null;
  }

  // Role-based access control for legacy enrollments
  if (userRole === 'STUDENT' && userId) {
    const student = await prisma.students.findUnique({
      where: { userId },
    });

    if (!student || enrollment.studentId !== student.id) {
      throw new Error('You can only view your own enrollments');
    }
  } else if (userRole === 'TEACHER' && userId) {
    const teacher = await prisma.teachers.findUnique({
      where: { userId },
    });

    if (!teacher || enrollment.groups.teacherId !== teacher.id) {
      throw new Error('You can only view enrollments for your own groups');
    }
  }

  return mapEnrollmentToResponseDto(enrollment);
};

/**
 * Get enrollments for a specific group
 * TEACHER can only see enrollments for their own groups
 * ADMIN can see enrollments for any group
 */
export const getEnrollmentsByGroup = async (
  groupId: string,
  userId?: string,
  userRole?: string
): Promise<EnrollmentsListResponseDto> => {
  // Check if group exists
  const group = await prisma.groups.findUnique({
    where: { id: groupId },
    include: {
      teachers: true,
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // If user is TEACHER, verify they own this group
  if (userRole === 'TEACHER' && userId) {
    const teacher = await prisma.teachers.findUnique({
      where: { userId },
    });

    if (!teacher || group.teacherId !== teacher.id) {
      throw new Error('You can only view enrollments for your own groups');
    }
  }

  // Get enrollments for this group (both legacy and V2)
  const legacyEnrollments = await prisma.enrollments.findMany({
    where: { groupId },
    orderBy: { id: 'asc' },
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
          semestre: true,
          estatus: true,
        },
      },
      groups: {
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
      },
    },
  });

  // Get V2 enrollments for this group
  const v2Enrollments = await (prisma as any).academic_activities.findMany({
    where: {
      enrollments_v2: {
        groupId: groupId,
      },
      activityType: 'ENROLLMENT',
      deletedAt: null,
    },
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
          semestre: true,
          estatus: true,
        },
      },
      enrollments_v2: {
        include: {
          groups: {
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
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  // Get special courses (English courses) for this group
  const specialCourses = await (prisma as any).academic_activities.findMany({
    where: {
      special_courses: {
        groupId: groupId, // Only courses with this specific group
      },
      activityType: 'SPECIAL_COURSE',
      deletedAt: null,
    },
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
          semestre: true,
          estatus: true,
        },
      },
      special_courses: {
        include: {
          groups: {
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
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  // Map legacy enrollments
  const mappedLegacyEnrollments = legacyEnrollments.map((enrollment) => ({
    id: enrollment.id,
    studentId: enrollment.studentId,
    groupId: enrollment.groupId,
    calificacion: enrollment.calificacion ? enrollment.calificacion.toNumber() : null,
    calificacionFinal: null,
    estatus: enrollment.estatus || 'INSCRITO',
    fechaInscripcion: enrollment.fechaInscripcion ? enrollment.fechaInscripcion.toISOString() : undefined,
    isSpecialCourse: false, // Legacy enrollments are not special courses
    courseType: null,
    nivelIngles: null,
    student: {
      id: enrollment.students.id,
      matricula: enrollment.students.matricula,
      nombre: enrollment.students.nombre,
      apellidoPaterno: enrollment.students.apellidoPaterno,
      apellidoMaterno: enrollment.students.apellidoMaterno,
      carrera: enrollment.students.carrera,
      semestre: enrollment.students.semestre,
      estatus: enrollment.students.estatus,
    },
    group: {
      id: enrollment.groups.id,
      nombre: enrollment.groups.nombre,
      periodo: enrollment.groups.periodo,
      subject: {
        id: enrollment.groups.subjects.id,
        clave: enrollment.groups.subjects.clave,
        nombre: enrollment.groups.subjects.nombre,
        creditos: enrollment.groups.subjects.creditos,
      },
      teacher: {
        id: enrollment.groups.teachers.id,
        nombre: enrollment.groups.teachers.nombre,
        apellidoPaterno: enrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: enrollment.groups.teachers.apellidoMaterno,
        departamento: enrollment.groups.teachers.departamento,
      },
    },
  }));

  // Map V2 enrollments
  const mappedV2Enrollments = v2Enrollments.map((activity: any) => {
    const group = activity.enrollments_v2?.groups;
    return {
      id: activity.id,
      studentId: activity.studentId,
      groupId: activity.enrollments_v2?.groupId || groupId,
      calificacion: activity.enrollments_v2?.calificacion ? activity.enrollments_v2.calificacion.toNumber() : null,
      calificacionFinal: activity.enrollments_v2?.calificacionFinal ? activity.enrollments_v2.calificacionFinal.toNumber() : null,
      estatus: activity.estatus || 'INSCRITO',
      fechaInscripcion: activity.fechaInscripcion ? activity.fechaInscripcion.toISOString() : undefined,
      porcentajeAsistencia: activity.enrollments_v2?.porcentajeAsistencia ? activity.enrollments_v2.porcentajeAsistencia.toNumber() : undefined,
      asistencias: activity.enrollments_v2?.asistencias || 0,
      faltas: activity.enrollments_v2?.faltas || 0,
      isSpecialCourse: false, // V2 enrollments are not special courses
      courseType: null,
      nivelIngles: null,
      student: {
        id: activity.students.id,
        matricula: activity.students.matricula,
        nombre: activity.students.nombre,
        apellidoPaterno: activity.students.apellidoPaterno,
        apellidoMaterno: activity.students.apellidoMaterno,
        carrera: activity.students.carrera,
        semestre: activity.students.semestre,
        estatus: activity.students.estatus,
      },
      group: group ? {
        id: group.id,
        nombre: group.nombre,
        periodo: group.periodo,
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
      } : null,
    };
  });

  // Map special courses (English courses) for this group
  const mappedSpecialCourses = specialCourses.map((activity: any) => {
    const group = activity.special_courses?.groups;
    return {
      id: activity.id, // This is the activityId from academic_activities
      studentId: activity.studentId,
      groupId: activity.special_courses?.groupId || groupId,
      calificacion: activity.special_courses?.calificacion ? activity.special_courses.calificacion.toNumber() : null,
      calificacionFinal: activity.special_courses?.calificacion ? activity.special_courses.calificacion.toNumber() : null,
      estatus: activity.special_courses?.estatus || activity.estatus || 'INSCRITO',
      fechaInscripcion: activity.fechaInscripcion ? activity.fechaInscripcion.toISOString() : undefined,
      porcentajeAsistencia: undefined, // Special courses don't have attendance tracking
      asistencias: 0,
      faltas: 0,
      isSpecialCourse: true, // Flag to identify special courses
      courseType: activity.special_courses?.courseType || null,
      nivelIngles: activity.special_courses?.nivelIngles || null,
      student: {
        id: activity.students.id,
        matricula: activity.students.matricula,
        nombre: activity.students.nombre,
        apellidoPaterno: activity.students.apellidoPaterno,
        apellidoMaterno: activity.students.apellidoMaterno,
        carrera: activity.students.carrera,
        semestre: activity.students.semestre,
        estatus: activity.students.estatus,
      },
      group: group ? {
        id: group.id,
        nombre: group.nombre,
        periodo: group.periodo,
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
      } : null,
    };
  });

  // Combine and deduplicate by studentId (V2 takes precedence, then special courses)
  const allEnrollments = [...mappedLegacyEnrollments, ...mappedV2Enrollments, ...mappedSpecialCourses];
  const uniqueEnrollments = Array.from(
    new Map(allEnrollments.map(e => [e.studentId, e])).values()
  );

  return {
    enrollments: uniqueEnrollments,
    pagination: {
      page: 1,
      limit: uniqueEnrollments.length,
      total: uniqueEnrollments.length,
      totalPages: 1,
    },
  };
};

/**
 * Create a new enrollment
 * Only ADMIN can create enrollments
 * Validates that studentId and groupId exist
 * Prevents duplicate enrollments (student already enrolled in group)
 */
export const createEnrollment = async (
  data: CreateEnrollmentDto
): Promise<EnrollmentResponseDto> => {
  const { studentId, groupId, calificacion } = data;

  // Apply business rule validations using validators
  await EnrollmentValidators.validateStudentActive(studentId);
  const group = await EnrollmentValidators.validateGroupAvailable(groupId);
  await EnrollmentValidators.validateGroupCapacity(groupId);
  await EnrollmentValidators.validateNoDuplicate(studentId, groupId);

  // Validate calificacion if provided
  EnrollmentValidators.validateGradeRange(calificacion, 'Calificacion');

  // Generate UUID for enrollment
  const enrollmentId = randomUUID();

  // Generate unique code for enrollment
  const enrollmentCount = await prisma.enrollments.count();
  const codigo = `ENR-${String(enrollmentCount + 1).padStart(8, '0')}`;

  // Build enrollment data with all fields from Phase 2
  // Note: academicPeriodId is not in the enrollments model - it's accessed through groups.periodoId
  const now = new Date();
  const enrollmentData: any = {
    id: enrollmentId,
    studentId,
    groupId,
    codigo,
    fechaInscripcion: now,
    tipoInscripcion: data.tipoInscripcion || 'NORMAL',
    estatus: data.estatus || 'INSCRITO',
    calificacion: calificacion ?? null,
    calificacionParcial1: data.calificacionParcial1 ?? null,
    calificacionParcial2: data.calificacionParcial2 ?? null,
    calificacionParcial3: data.calificacionParcial3 ?? null,
    calificacionFinal: data.calificacionFinal ?? null,
    calificacionExtra: data.calificacionExtra ?? null,
    asistencias: data.asistencias ?? 0,
    faltas: data.faltas ?? 0,
    retardos: data.retardos ?? 0,
    porcentajeAsistencia: data.porcentajeAsistencia ?? null,
    aprobado: data.aprobado ?? null,
    fechaAprobacion: data.fechaAprobacion ? new Date(data.fechaAprobacion) : null,
    observaciones: data.observaciones ?? null,
    // academicPeriodId removed - not in schema. Access via groups.periodoId if needed
    createdAt: now,
    updatedAt: now,
  };

  // Create enrollment
  // Type assertion needed because Prisma Client may not recognize all fields
  const enrollment = await prisma.enrollments.create({
    data: enrollmentData as Prisma.enrollmentsUncheckedCreateInput,
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
          semestre: true,
          estatus: true,
        },
      },
      groups: {
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
      },
    },
  });

  // Update group capacity
  await prisma.groups.update({
    where: { id: groupId },
    data: { cupoActual: { increment: 1 } },
  });

  return {
    ...mapEnrollmentToResponseDto(enrollment),
    student: {
      id: enrollment.students.id,
      matricula: enrollment.students.matricula,
      nombre: enrollment.students.nombre,
      apellidoPaterno: enrollment.students.apellidoPaterno,
      apellidoMaterno: enrollment.students.apellidoMaterno,
      carrera: enrollment.students.carrera,
      semestre: enrollment.students.semestre,
      estatus: enrollment.students.estatus,
    },
    group: {
      id: enrollment.groups.id,
      nombre: enrollment.groups.nombre,
      periodo: enrollment.groups.periodo,
      subject: {
        id: enrollment.groups.subjects.id,
        clave: enrollment.groups.subjects.clave,
        nombre: enrollment.groups.subjects.nombre,
        creditos: enrollment.groups.subjects.creditos,
      },
      teacher: {
        id: enrollment.groups.teachers.id,
        nombre: enrollment.groups.teachers.nombre,
        apellidoPaterno: enrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: enrollment.groups.teachers.apellidoMaterno,
        departamento: enrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Update an existing enrollment
 * TEACHER can only update calificacion (and only for groups they teach)
 * ADMIN can update all fields
 */
export const updateEnrollment = async (
  id: string,
  data: UpdateEnrollmentDto,
  userId?: string,
  userRole?: string
): Promise<EnrollmentResponseDto> => {
  // Check if enrollment exists
  const existingEnrollment = await prisma.enrollments.findUnique({
    where: { id },
    include: {
      groups: {
        include: {
          teachers: true,
        },
      },
    },
  });

  if (!existingEnrollment) {
    throw new Error('Enrollment not found');
  }

  // If user is TEACHER, they can only update calificacion
  // and only for groups they teach
  if (userRole === 'TEACHER' && userId) {
    // Find teacher record for this user
    const teacher = await prisma.teachers.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Check if this enrollment belongs to a group taught by this teacher
    if (existingEnrollment.groups.teacherId !== teacher.id) {
      throw new Error('You can only update grades for your own groups');
    }

    // TEACHER can only update calificacion
    if (data.studentId !== undefined || data.groupId !== undefined) {
      throw new Error('Teachers can only update calificacion');
    }

    // Validate calificacion if provided
    if (data.calificacion !== undefined && data.calificacion !== null) {
      if (data.calificacion < 0 || data.calificacion > 100) {
        throw new Error('Calificacion must be between 0 and 100');
      }
    }
  }

  // ADMIN can update all fields
  if (userRole === 'ADMIN') {
    // RB-036: Validate that studentId cannot be changed when editing
    EnrollmentValidators.validateStudentIdCannotChange(data.studentId, existingEnrollment.studentId);

    // RB-001: Validate studentId if provided (should not change due to RB-036, but keep for safety)
    if (data.studentId) {
      await EnrollmentValidators.validateStudentActive(data.studentId);
    }

    // RB-002, RB-007, RB-008: Validate groupId if provided
    if (data.groupId) {
      await EnrollmentValidators.validateGroupAvailable(data.groupId);

      // RB-023: Only allow changing group if enrollment status is INSCRITO or EN_CURSO
      const currentStatus = data.estatus || existingEnrollment.estatus;
      if (data.groupId !== existingEnrollment.groupId) {
        EnrollmentValidators.validateGroupChangeAllowed(currentStatus);
        await EnrollmentValidators.validateNewGroupCapacity(data.groupId);

        // RB-003: Check for duplicate enrollment
        await EnrollmentValidators.validateNoDuplicate(
          data.studentId || existingEnrollment.studentId,
          data.groupId
        );
      }
    }

    // RB-021: Validate state transitions
    if (data.estatus && data.estatus !== existingEnrollment.estatus) {
      EnrollmentValidators.validateStatusTransition(existingEnrollment.estatus, data.estatus);
    }

    // RB-020: Restrict editable fields based on status
    const currentStatus = data.estatus || existingEnrollment.estatus;
    EnrollmentValidators.validateEditableFields(currentStatus, data);

    // Validate calificacion if provided
    EnrollmentValidators.validateGradeRange(data.calificacion, 'Calificacion');
  }

  // RB-014: Auto-calculate aprobado based on calificacionFinal
  let finalAprobado = EnrollmentCalculators.calculateAprobado(
    data.calificacionFinal,
    data.aprobado
  );

  // RB-014: Check consistency (logs warning but doesn't throw)
  if (data.calificacionFinal !== undefined && data.aprobado !== undefined) {
    EnrollmentCalculators.checkAprobadoConsistency(id, data.calificacionFinal, data.aprobado);
  }

  // RB-016: Auto-calculate porcentajeAsistencia if asistencias or faltas changed
  const asistencias = data.asistencias !== undefined ? data.asistencias : existingEnrollment.asistencias;
  const faltas = data.faltas !== undefined ? data.faltas : existingEnrollment.faltas;
  const finalPorcentajeAsistencia = EnrollmentCalculators.calculatePorcentajeAsistencia(
    asistencias,
    faltas,
    data.porcentajeAsistencia
  );

  // RB-015: Set fechaAprobacion if aprobado is true
  const finalFechaAprobacion = EnrollmentCalculators.calculateFechaAprobacion(
    finalAprobado,
    data.fechaAprobacion
  );

  // Track if group is being changed for capacity update
  const isChangingGroup = data.groupId !== undefined && data.groupId !== existingEnrollment.groupId;
  const oldGroupId = existingEnrollment.groupId;
  const newGroupId = data.groupId || existingEnrollment.groupId;

  // Build update data (only include provided fields)
  const updateData: Record<string, unknown> = {};
  if (data.calificacion !== undefined) updateData.calificacion = data.calificacion;
  if (data.studentId !== undefined) updateData.studentId = data.studentId;
  if (data.groupId !== undefined) updateData.groupId = data.groupId;
  // New fields (Phase 2)
  if (data.tipoInscripcion !== undefined) updateData.tipoInscripcion = data.tipoInscripcion;
  if (data.estatus !== undefined) updateData.estatus = data.estatus;
  if (data.fechaBaja !== undefined) updateData.fechaBaja = data.fechaBaja ? new Date(data.fechaBaja) : null;
  // Partial grades
  if (data.calificacionParcial1 !== undefined) updateData.calificacionParcial1 = data.calificacionParcial1;
  if (data.calificacionParcial2 !== undefined) updateData.calificacionParcial2 = data.calificacionParcial2;
  if (data.calificacionParcial3 !== undefined) updateData.calificacionParcial3 = data.calificacionParcial3;
  if (data.calificacionFinal !== undefined) updateData.calificacionFinal = data.calificacionFinal;
  if (data.calificacionExtra !== undefined) updateData.calificacionExtra = data.calificacionExtra;
  // Attendance
  if (data.asistencias !== undefined) updateData.asistencias = data.asistencias;
  if (data.faltas !== undefined) updateData.faltas = data.faltas;
  if (data.retardos !== undefined) updateData.retardos = data.retardos;
  if (finalPorcentajeAsistencia !== undefined) updateData.porcentajeAsistencia = finalPorcentajeAsistencia;
  // Evaluation
  if (finalAprobado !== undefined) updateData.aprobado = finalAprobado;
  if (finalFechaAprobacion !== undefined) updateData.fechaAprobacion = finalFechaAprobacion ? new Date(finalFechaAprobacion) : null;
  if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

  // RB-008: Update group capacity if group is being changed (use transaction)
  if (isChangingGroup) {
    await prisma.$transaction(async (tx) => {
      // Decrement old group capacity
      await tx.groups.update({
        where: { id: oldGroupId },
        data: { cupoActual: { decrement: 1 } },
      });

      // Increment new group capacity
      await tx.groups.update({
        where: { id: newGroupId },
        data: { cupoActual: { increment: 1 } },
      });

      // Update enrollment
      return await tx.enrollments.update({
        where: { id },
        data: updateData,
        include: {
          students: {
            select: {
              id: true,
              matricula: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              carrera: true,
              semestre: true,
              estatus: true,
            },
          },
          groups: {
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
          },
        },
      });
    });
  }

  // Update enrollment (if group is not being changed)
  const enrollment = await prisma.enrollments.update({
    where: { id },
    data: updateData,
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
          semestre: true,
          estatus: true,
        },
      },
      groups: {
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
      },
    },
  });

  return {
    ...mapEnrollmentToResponseDto(enrollment),
    student: {
      id: enrollment.students.id,
      matricula: enrollment.students.matricula,
      nombre: enrollment.students.nombre,
      apellidoPaterno: enrollment.students.apellidoPaterno,
      apellidoMaterno: enrollment.students.apellidoMaterno,
      carrera: enrollment.students.carrera,
      semestre: enrollment.students.semestre,
      estatus: enrollment.students.estatus,
    },
    group: {
      id: enrollment.groups.id,
      nombre: enrollment.groups.nombre,
      periodo: enrollment.groups.periodo,
      subject: {
        id: enrollment.groups.subjects.id,
        clave: enrollment.groups.subjects.clave,
        nombre: enrollment.groups.subjects.nombre,
        creditos: enrollment.groups.subjects.creditos,
      },
      teacher: {
        id: enrollment.groups.teachers.id,
        nombre: enrollment.groups.teachers.nombre,
        apellidoPaterno: enrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: enrollment.groups.teachers.apellidoMaterno,
        departamento: enrollment.groups.teachers.departamento,
      },
    },
  };

  // RB-037: Recalculate student averages after updating enrollment
  // Only recalculate if grade-related fields were updated
  const gradeFieldsUpdated = 
    data.calificacion !== undefined ||
    data.calificacionFinal !== undefined ||
    data.calificacionParcial1 !== undefined ||
    data.calificacionParcial2 !== undefined ||
    data.calificacionParcial3 !== undefined ||
    isChangingGroup;

  if (gradeFieldsUpdated) {
    // Recalculate in background (don't wait for it)
    recalculateStudentAverages(enrollment.studentId).catch((error: unknown) => {
      console.error('Error recalculating student averages:', error);
      // Don't throw - this is a background operation
    });
  }

  return {
    ...mapEnrollmentToResponseDto(enrollment),
    student: {
      id: enrollment.students.id,
      matricula: enrollment.students.matricula,
      nombre: enrollment.students.nombre,
      apellidoPaterno: enrollment.students.apellidoPaterno,
      apellidoMaterno: enrollment.students.apellidoMaterno,
      carrera: enrollment.students.carrera,
      semestre: enrollment.students.semestre,
      estatus: enrollment.students.estatus,
    },
    group: {
      id: enrollment.groups.id,
      nombre: enrollment.groups.nombre,
      periodo: enrollment.groups.periodo,
      subject: {
        id: enrollment.groups.subjects.id,
        clave: enrollment.groups.subjects.clave,
        nombre: enrollment.groups.subjects.nombre,
        creditos: enrollment.groups.subjects.creditos,
      },
      teacher: {
        id: enrollment.groups.teachers.id,
        nombre: enrollment.groups.teachers.nombre,
        apellidoPaterno: enrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: enrollment.groups.teachers.apellidoMaterno,
        departamento: enrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Delete an enrollment
 * ADMIN only
 */
export const deleteEnrollment = async (id: string): Promise<void> => {
  // Check if enrollment exists
  const enrollment = await prisma.enrollments.findUnique({
    where: { id },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Delete enrollment
  await prisma.enrollments.delete({
    where: { id },
  });
};


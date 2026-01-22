// Special Courses Service - Business logic for special course activities
// V2: Servicio para cursos especiales (grupo opcional)
import { randomUUID } from 'crypto';
import prisma from '../../../config/database';
import { generateActivityCode, updateActivityStatus } from '../academic-activities.service';
import { recalculateStudentAverages } from '../../students/students.service';
import { SpecialCoursesValidators } from './special-courses.validators';
import { EntityValidators } from '../../../shared/validators/entity.validators';

/**
 * Create special course enrollment
 * Group is optional - some courses may not have a traditional group
 */
export const createSpecialCourse = async (
  studentId: string,
  courseType: 'INGLES' | 'VERANO' | 'EXTRACURRICULAR' | 'TALLER' | 'SEMINARIO' | 'DIPLOMADO' | 'CERTIFICACION',
  nivelIngles?: number,
  groupId?: string,
  requierePago: boolean = true
) => {
  // Validate student exists
  await EntityValidators.validateStudentExists(studentId);

  // Validate course-specific rules
  if (courseType === 'INGLES') {
    await SpecialCoursesValidators.validateCanRequestEnglishCourse(studentId, nivelIngles || 1);
  }

  // Validate group if provided
  if (groupId) {
    await EntityValidators.validateGroupExists(groupId);
    // Check if student is already enrolled in this specific group
    await SpecialCoursesValidators.validateNotEnrolledInGroup(studentId, groupId);
  }

  // Generate codes
  const codigo = await generateActivityCode('SPECIAL_COURSE');
  const activityId = randomUUID();
  const courseId = randomUUID();

  // Determine initial status
  const estatus = requierePago ? 'PENDIENTE_PAGO' : 'INSCRITO';

  // Create activity and course in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create academic activity
    const activity = await (tx as any).academic_activities.create({
      data: {
        id: activityId,
        studentId,
        activityType: 'SPECIAL_COURSE',
        codigo,
        estatus,
        fechaInscripcion: new Date(),
      },
    });

    // Create special course
    const course = await (tx as any).special_courses.create({
      data: {
        id: courseId,
        activityId: activity.id,
        courseType,
        nivelIngles: nivelIngles || null,
        groupId: groupId || null,
        requierePago,
        pagoAprobado: requierePago ? null : true, // Auto-approved if no payment required
        fechaPagoAprobado: requierePago ? null : new Date(),
      },
    });

    // Update group capacity if group provided and payment not required
    if (groupId && !requierePago) {
      await (tx as any).groups.update({
        where: { id: groupId },
        data: { cupoActual: { increment: 1 } },
      });
    }

    // Log to history
    await (tx as any).activity_history.create({
      data: {
        id: randomUUID(),
        activityId: activity.id,
        accion: 'CREATED',
        descripcion: `Curso especial de ${courseType} creado`,
      },
    });

    return { activity, course };
  });

  return {
    id: result.activity.id,
    codigo: result.activity.codigo,
    estatus: result.activity.estatus,
    courseType: result.course.courseType,
    nivelIngles: result.course.nivelIngles,
    requierePago: result.course.requierePago,
  };
};

/**
 * Receive and approve payment for special course (Admin only)
 * Admin receives physical payment proof and approves payment in one step
 */
export const receiveAndApprovePayment = async (
  activityId: string,
  montoPago: number,
  observaciones?: string,
  approvedBy?: string,
  fechaInicio?: string
) => {
  // Validate payment amount
  if (montoPago <= 0) {
    throw new Error('El monto del pago debe ser mayor a 0');
  }

  // Get activity and course
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: {
      special_courses: true,
    },
  });

  if (!activity || !activity.special_courses) {
    throw new Error('Curso especial no encontrado');
  }

  if (activity.activityType !== 'SPECIAL_COURSE') {
    throw new Error('Esta actividad no es un curso especial');
  }

  if (activity.estatus !== 'PENDIENTE_PAGO') {
    throw new Error('Este curso no está pendiente de pago');
  }

  // Update course with payment info and approve
  const updateData: any = {
    montoPago,
    pagoAprobado: true,
    fechaPagoAprobado: new Date(),
  };

  // Add fechaInicio if provided
  if (fechaInicio) {
    updateData.fechaInicio = new Date(fechaInicio);
  }

  await (prisma as any).special_courses.update({
    where: { id: activity.special_courses.id },
    data: updateData,
  });

  // Update activity status to INSCRITO (can now attend course)
  await updateActivityStatus(activityId, 'INSCRITO', approvedBy);

  // Update activity observations if provided
  if (observaciones) {
    await (prisma as any).academic_activities.update({
      where: { id: activityId },
      data: {
        observaciones: observaciones,
      },
    });
  }

  // Update group capacity if group exists
  if (activity.special_courses.groupId) {
    await (prisma as any).groups.update({
      where: { id: activity.special_courses.groupId },
      data: { cupoActual: { increment: 1 } },
    });
  }

  // Log to history
  await (prisma as any).activity_history.create({
    data: {
      id: randomUUID(),
      activityId,
      accion: 'PAYMENT_APPROVED',
      descripcion: observaciones 
        ? `Comprobante físico recibido y pago aprobado. Monto: ${montoPago}. Observaciones: ${observaciones}`
        : `Comprobante físico recibido y pago aprobado. Monto: ${montoPago}`,
      realizadoPor: approvedBy,
    },
  });

  return {
    activityId,
    estatus: 'INSCRITO',
    montoPago,
  };
};

/**
 * Reject payment for special course
 */
export const rejectPayment = async (
  activityId: string,
  motivo: string,
  rejectedBy?: string
) => {
  // Get activity and course
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: {
      special_courses: true,
    },
  });

  if (!activity || !activity.special_courses) {
    throw new Error('Curso especial no encontrado');
  }

  if (activity.estatus !== 'PENDIENTE_PAGO') {
    throw new Error('Este curso debe estar pendiente de pago para rechazarlo');
  }

  // Update course - reject payment
  await (prisma as any).special_courses.update({
    where: { id: activity.special_courses.id },
    data: {
      pagoAprobado: false,
      montoPago: null, // Clear payment amount
    },
  });

  // Update activity observations with rejection reason
  await (prisma as any).academic_activities.update({
    where: { id: activityId },
    data: {
      observaciones: `Pago rechazado. Motivo: ${motivo}`,
      updatedBy: rejectedBy,
      updatedAt: new Date(),
    },
  });

  // Log to history
  await (prisma as any).activity_history.create({
    data: {
      id: randomUUID(),
      activityId,
      accion: 'PAYMENT_REJECTED',
      descripcion: motivo,
      realizadoPor: rejectedBy,
    },
  });

  return {
    activityId,
    estatus: 'PENDIENTE_PAGO',
    pagoAprobado: false,
  };
};

/**
 * Get all special courses (Admin only)
 * Returns all special course enrollments with filters and pagination
 */
export const getAllSpecialCourses = async (
  query: {
    page?: number;
    limit?: number;
    studentId?: string;
    courseType?: string;
    nivelIngles?: number;
    estatus?: string;
    requierePago?: boolean;
    fechaInicio?: string;
    fechaFin?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{
  courses: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    activityType: 'SPECIAL_COURSE',
    deletedAt: null,
  };

  if (query.studentId) {
    where.studentId = query.studentId;
  }

  if (query.estatus) {
    where.estatus = query.estatus;
  }

  // Build special_courses filter
  const specialCoursesWhere: any = {};
  if (query.courseType) {
    specialCoursesWhere.courseType = query.courseType;
  }
  if (query.nivelIngles !== undefined) {
    specialCoursesWhere.nivelIngles = query.nivelIngles;
  }
  if (query.requierePago !== undefined) {
    specialCoursesWhere.requierePago = query.requierePago;
  }

  // Date filters
  if (query.fechaInicio || query.fechaFin) {
    where.fechaInscripcion = {};
    if (query.fechaInicio) {
      where.fechaInscripcion.gte = new Date(query.fechaInicio);
    }
    if (query.fechaFin) {
      where.fechaInscripcion.lte = new Date(query.fechaFin);
    }
  }

  // Get total count (excluding diagnostic-completed courses)
  const finalSpecialCoursesWhereForCount = {
    ...specialCoursesWhere,
    completadoPorDiagnostico: false,
  };
  
  const total = await (prisma as any).academic_activities.count({
    where: {
      ...where,
      special_courses: Object.keys(finalSpecialCoursesWhereForCount).length > 0 ? finalSpecialCoursesWhereForCount : { completadoPorDiagnostico: false },
    },
  });

  // Build orderBy
  const orderBy: any = {};
  if (query.sortBy) {
    orderBy[query.sortBy] = query.sortOrder || 'desc';
  } else {
    orderBy.fechaInscripcion = 'desc';
  }

  // Build where clause to exclude courses completed by diagnostic exam
  // These are kept in DB for calculations but shouldn't appear in lists
  const finalSpecialCoursesWhere = {
    ...specialCoursesWhere,
    completadoPorDiagnostico: false, // Exclude diagnostic-completed courses
  };

  // Fetch activities
  const activities = await (prisma as any).academic_activities.findMany({
    where: {
      ...where,
      special_courses: Object.keys(finalSpecialCoursesWhere).length > 0 ? finalSpecialCoursesWhere : { completadoPorDiagnostico: false },
    },
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
        },
      },
      special_courses: {
        include: {
          groups: {
            select: {
              id: true,
              nombre: true,
              periodo: true,
            },
          },
        },
      },
    },
    orderBy,
    skip,
    take: limit,
  });

  // Map to response format
  const courses = activities.map((activity: any) => ({
    id: activity.id,
    codigo: activity.codigo,
    estatus: activity.estatus,
    fechaInscripcion: activity.fechaInscripcion.toISOString(),
    observaciones: activity.observaciones,
    student: activity.students ? {
      id: activity.students.id,
      matricula: activity.students.matricula,
      nombre: activity.students.nombre,
      apellidoPaterno: activity.students.apellidoPaterno,
      apellidoMaterno: activity.students.apellidoMaterno,
    } : null,
    course: activity.special_courses ? {
      courseType: activity.special_courses.courseType,
      nivelIngles: activity.special_courses.nivelIngles,
      groupId: activity.special_courses.groupId,
      group: activity.special_courses.groups ? {
        id: activity.special_courses.groups.id,
        nombre: activity.special_courses.groups.nombre,
        periodo: activity.special_courses.groups.periodo,
      } : null,
      calificacion: activity.special_courses.calificacion ? Number(activity.special_courses.calificacion) : null,
      aprobado: activity.special_courses.aprobado,
      fechaAprobacion: activity.special_courses.fechaAprobacion?.toISOString() || null,
      requierePago: activity.special_courses.requierePago,
      pagoAprobado: activity.special_courses.pagoAprobado,
      fechaPagoAprobado: activity.special_courses.fechaPagoAprobado?.toISOString() || null,
      montoPago: activity.special_courses.montoPago ? Number(activity.special_courses.montoPago) : null,
      fechaInicio: activity.special_courses.fechaInicio?.toISOString() || null,
    } : null,
  }));

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get special course by activity ID
 */
export const getSpecialCourseById = async (activityId: string) => {
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
        },
      },
      special_courses: {
        include: {
          groups: {
            select: {
              id: true,
              nombre: true,
              periodo: true,
            },
          },
        },
      },
    },
  });

  if (!activity || activity.activityType !== 'SPECIAL_COURSE' || activity.deletedAt) {
    return null;
  }

  return {
    id: activity.id,
    codigo: activity.codigo,
    estatus: activity.estatus,
    fechaInscripcion: activity.fechaInscripcion.toISOString(),
    observaciones: activity.observaciones,
    student: activity.students ? {
      id: activity.students.id,
      matricula: activity.students.matricula,
      nombre: activity.students.nombre,
      apellidoPaterno: activity.students.apellidoPaterno,
      apellidoMaterno: activity.students.apellidoMaterno,
    } : null,
    course: activity.special_courses ? {
      courseType: activity.special_courses.courseType,
      nivelIngles: activity.special_courses.nivelIngles,
      groupId: activity.special_courses.groupId,
      group: activity.special_courses.groups ? {
        id: activity.special_courses.groups.id,
        nombre: activity.special_courses.groups.nombre,
        periodo: activity.special_courses.groups.periodo,
      } : null,
      calificacion: activity.special_courses.calificacion ? Number(activity.special_courses.calificacion) : null,
      aprobado: activity.special_courses.aprobado,
      fechaAprobacion: activity.special_courses.fechaAprobacion?.toISOString() || null,
      requierePago: activity.special_courses.requierePago,
      pagoAprobado: activity.special_courses.pagoAprobado,
      fechaPagoAprobado: activity.special_courses.fechaPagoAprobado?.toISOString() || null,
      montoPago: activity.special_courses.montoPago ? Number(activity.special_courses.montoPago) : null,
      fechaInicio: activity.special_courses.fechaInicio?.toISOString() || null,
    } : null,
  };
};

/**
 * Complete special course
 */
export const completeSpecialCourse = async (
  activityId: string,
  calificacion: number,
  completedBy?: string
) => {
  // Validate grade
  if (calificacion < 0 || calificacion > 100) {
    throw new Error('La calificación debe estar entre 0 y 100');
  }

  // Get activity and course
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: {
      special_courses: true,
      students: true,
    },
  });

  if (!activity || !activity.special_courses) {
    throw new Error('Curso especial no encontrado');
  }

  // Update course with grade
  await (prisma as any).special_courses.update({
    where: { id: activity.special_courses.id },
    data: {
      calificacion,
      aprobado: calificacion >= 70,
      fechaAprobacion: calificacion >= 70 ? new Date() : null,
    },
  });

  // Update activity status
  const newStatus = calificacion >= 70 ? 'APROBADO' : 'REPROBADO';
  await updateActivityStatus(activityId, newStatus, completedBy);

  // If English course, update student certification
  if (activity.special_courses.courseType === 'INGLES' && calificacion >= 70) {
    await SpecialCoursesValidators.updateStudentEnglishCertification(
      activity.studentId,
      activity.special_courses.nivelIngles || 1,
      calificacion
    );
  }

  // Recalculate student averages
  await recalculateStudentAverages(activity.studentId).catch((error: unknown) => {
    console.error('Error recalculating student averages:', error);
  });

  // Log to history
  await (prisma as any).activity_history.create({
    data: {
      id: randomUUID(),
      activityId,
      accion: 'GRADE_UPDATED',
      campoAnterior: 'calificacion',
      valorAnterior: activity.special_courses.calificacion?.toString() || null,
      valorNuevo: calificacion.toString(),
      realizadoPor: completedBy,
    },
  });

  return {
    activityId,
    calificacion,
    aprobado: calificacion >= 70,
    estatus: newStatus,
  };
};


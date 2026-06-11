// Special Courses Service - Business logic for special course activities
// V2: Servicio para cursos especiales (grupo opcional)
import { randomUUID } from 'node:crypto';
import prisma from '../../../config/database';
import { generateActivityCode, updateActivityStatus } from '../academic-activities.service';
import { recalculateStudentAverages } from '../../students/students.service';
import { SpecialCoursesValidators } from './special-courses.validators';
import { EntityValidators } from '../../../shared/validators/entity.validators';

/**
 * Create special course enrollment
 * - Con groupId: inscripción a un grupo publicado → requiere pago (PENDIENTE_PAGO).
 * - Sin groupId: NO es una inscripción evaluable; entra a LISTA_ESPERA para que el
 *   admin detecte demanda, genere un grupo y asigne desde la lista.
 * La política de pago la decide el servidor, nunca el request del alumno.
 */
export const createSpecialCourse = async (
  studentId: string,
  courseType: 'INGLES' | 'VERANO' | 'EXTRACURRICULAR' | 'TALLER' | 'SEMINARIO' | 'DIPLOMADO' | 'CERTIFICACION',
  nivelIngles?: number,
  groupId?: string
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
    // El grupo debe corresponder al curso solicitado (tipo y nivel) y tener cupo
    await SpecialCoursesValidators.validateGroupMatchesCourse(groupId, courseType, nivelIngles);
    // Check if student is already enrolled in this specific group
    await SpecialCoursesValidators.validateNotEnrolledInGroup(studentId, groupId);
  }

  // Generate codes
  const codigo = await generateActivityCode('SPECIAL_COURSE');
  const activityId = randomUUID();
  const courseId = randomUUID();

  // Server-side: con grupo publicado se paga; sin grupo entra a lista de espera
  const requierePago = !!groupId;
  const estatus = groupId ? 'PENDIENTE_PAGO' : 'LISTA_ESPERA';

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
        pagoAprobado: null, // Se define al aprobar pago (con grupo) o al asignar grupo (lista de espera)
        fechaPagoAprobado: null,
      },
    });

    // Log to history
    await (tx as any).activity_history.create({
      data: {
        id: randomUUID(),
        activityId: activity.id,
        accion: 'CREATED',
        descripcion: groupId
          ? `Curso especial de ${courseType} solicitado (grupo asignado, pendiente de pago)`
          : `Curso especial de ${courseType} agregado a lista de espera (sin grupo publicado)`,
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
 * Assign a group to a waitlisted special course (Admin only)
 * Saca la solicitud de LISTA_ESPERA: valida el grupo y pasa a PENDIENTE_PAGO
 * (o INSCRITO si el admin indica que no requiere pago).
 */
export const assignGroupToCourse = async (
  activityId: string,
  groupId: string,
  requierePago: boolean,
  assignedBy?: string
) => {
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: { special_courses: true },
  });

  if (!activity || !activity.special_courses) {
    throw new Error('Curso especial no encontrado');
  }

  if (activity.estatus !== 'LISTA_ESPERA') {
    throw new Error('Solo se puede asignar grupo a solicitudes en lista de espera');
  }

  await EntityValidators.validateGroupExists(groupId);
  await SpecialCoursesValidators.validateGroupMatchesCourse(
    groupId,
    activity.special_courses.courseType,
    activity.special_courses.nivelIngles ?? undefined
  );

  const newStatus = requierePago ? 'PENDIENTE_PAGO' : 'INSCRITO';

  await prisma.$transaction(async (tx) => {
    await (tx as any).special_courses.update({
      where: { id: activity.special_courses.id },
      data: {
        groupId,
        requierePago,
        pagoAprobado: requierePago ? null : true,
        fechaPagoAprobado: requierePago ? null : new Date(),
      },
    });

    // Si no requiere pago queda INSCRITO de inmediato y consume cupo;
    // si requiere pago, el cupo se consume al aprobar el pago (flujo existente)
    if (!requierePago) {
      await (tx as any).groups.update({
        where: { id: groupId },
        data: { cupoActual: { increment: 1 } },
      });
    }

    await (tx as any).activity_history.create({
      data: {
        id: randomUUID(),
        activityId,
        accion: 'UPDATED',
        descripcion: `Grupo asignado desde lista de espera${requierePago ? ' (pendiente de pago)' : ''}`,
        realizadoPor: assignedBy,
      },
    });
  });

  await updateActivityStatus(activityId, newStatus, assignedBy);

  return {
    activityId,
    groupId,
    estatus: newStatus,
    requierePago,
  };
};

/**
 * Waitlist summary (Admin only)
 * Demanda por tipo de curso y nivel: cuántos alumnos esperan grupo.
 */
export const getWaitlistSummary = async () => {
  const waitlisted = await (prisma as any).academic_activities.findMany({
    where: {
      activityType: 'SPECIAL_COURSE',
      estatus: 'LISTA_ESPERA',
      deletedAt: null,
    },
    include: {
      special_courses: {
        select: {
          courseType: true,
          nivelIngles: true,
        },
      },
    },
  });

  const byKey = new Map<string, { courseType: string; nivelIngles: number | null; count: number }>();
  for (const activity of waitlisted) {
    const courseType = activity.special_courses?.courseType || 'DESCONOCIDO';
    const nivelIngles = activity.special_courses?.nivelIngles ?? null;
    const key = `${courseType}:${nivelIngles}`;
    const entry = byKey.get(key) || { courseType, nivelIngles, count: 0 };
    entry.count += 1;
    byKey.set(key, entry);
  }

  return {
    total: waitlisted.length,
    demand: Array.from(byKey.values()).sort((a, b) => (a.nivelIngles ?? 0) - (b.nivelIngles ?? 0)),
  };
};

/**
 * Register initial English level for a student (Admin only)
 * Para alumnos de transferencia/equivalencia que ya traen nivel: crea los registros
 * canónicos de niveles acreditados (1..nivel-1) y posiciona al alumno en `nivel`.
 * Los campos de students (nivelInglesActual, promedioIngles, etc.) los fija el flujo
 * canónico + recálculo; nunca se editan a mano.
 */
export const registerInitialEnglishLevel = async (
  studentId: string,
  nivel: number,
  calificacion: number,
  calificacionesPorNivel?: Record<number, number>,
  registeredBy?: string
) => {
  if (nivel < 1 || nivel > 6) {
    throw new Error('El nivel inicial debe estar entre 1 y 6');
  }
  if (calificacion < 70 || calificacion > 100) {
    throw new Error('La calificación de equivalencia debe ser aprobatoria (70-100)');
  }

  const student = await EntityValidators.validateStudentExists(studentId);

  if (student.nivelInglesActual) {
    throw new Error(
      `El alumno ya tiene nivel de inglés asignado (nivel ${student.nivelInglesActual}). El nivel inicial solo se registra una vez.`
    );
  }

  // Si ya tiene actividad de inglés activa (examen o curso), el nivel debe venir del flujo normal.
  // Las canceladas/bajas no cuentan.
  const existingEnglishActivity = await (prisma as any).academic_activities.findFirst({
    where: {
      studentId,
      deletedAt: null,
      estatus: { notIn: ['CANCELADO', 'BAJA'] },
      OR: [
        { exams: { examType: 'DIAGNOSTICO' } },
        { special_courses: { courseType: 'INGLES' } },
      ],
    },
  });

  if (existingEnglishActivity) {
    throw new Error(
      'El alumno ya tiene actividades de inglés registradas; su nivel debe salir del flujo normal (diagnóstico/cursos), no de una equivalencia.'
    );
  }

  // Crea niveles acreditados 1..nivel-1 y posiciona al alumno en `nivel`
  const { ExamsValidators } = await import('../exams/exams.validators');
  await ExamsValidators.updateStudentEnglishLevel(
    studentId,
    calificacion,
    nivel,
    calificacionesPorNivel,
    'EQUIVALENCIA'
  );

  await recalculateStudentAverages(studentId).catch((error: unknown) => {
    console.error('Error recalculating student averages after initial level:', error);
  });

  return {
    studentId,
    nivelInglesActual: nivel,
    nivelesAcreditados: Array.from({ length: nivel - 1 }, (_, i) => i + 1),
    registradoPor: registeredBy,
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


// Academic Activities Service - Base service for all academic activities
// V2: Servicio base para todas las actividades académicas
import { randomUUID } from 'node:crypto';
import prisma from '../../config/database';
import { EntityValidators } from '../../shared/validators/entity.validators';

/**
 * Get activity by ID with all related data
 */
export const getActivityById = async (activityId: string) => {
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
      exams: {
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
      special_courses: {
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
      },
      social_service: true,
      professional_practices: {
        include: {
          academic_periods: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('Activity not found');
  }

  return activity;
};

/**
 * Get all activities for a student
 */
export const getActivitiesByStudent = async (
  studentId: string,
  activityType?: 'ENROLLMENT' | 'EXAM' | 'SPECIAL_COURSE' | 'SOCIAL_SERVICE' | 'PROFESSIONAL_PRACTICE'
) => {
  const where: any = {
    studentId,
    deletedAt: null,
  };

  if (activityType) {
    where.activityType = activityType;
  }

  const activities = await (prisma as any).academic_activities.findMany({
    where,
    include: {
      enrollments_v2: {
        include: {
          groups: {
            include: {
              subjects: true,
              teachers: true,
            },
          },
        },
      },
      exams: {
        include: {
          subjects: true,
        },
      },
      special_courses: {
        include: {
          groups: {
            include: {
              subjects: true,
            },
          },
        },
      },
      social_service: true,
      professional_practices: {
        include: {
          academic_periods: true,
        },
      },
    },
    orderBy: {
      fechaInscripcion: 'desc',
    },
  });

  return activities;
};

/**
 * Generate unique code for activity
 */
export const generateActivityCode = async (activityType: string): Promise<string> => {
  const prefix = activityType === 'EXAM' ? 'EXA' : 
                 activityType === 'SPECIAL_COURSE' ? 'CUR' :
                 activityType === 'SOCIAL_SERVICE' ? 'SS' :
                 activityType === 'PROFESSIONAL_PRACTICE' ? 'PP' : 'INS';
  
  const count = await (prisma as any).academic_activities.count({
    where: {
      activityType: activityType as any,
    },
  });

  return `${prefix}-${String(count + 1).padStart(8, '0')}`;
};

/**
 * Update activity status
 */
export const updateActivityStatus = async (
  activityId: string,
  newStatus: 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'EVALUADO' | 'CANCELADO' | 'PENDIENTE_PAGO' | 'PAGO_PENDIENTE_APROBACION' | 'PAGO_APROBADO' | 'COMPLETADO' | 'EN_REVISION',
  updatedBy?: string
) => {
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    throw new Error('Activity not found');
  }

  const updated = await (prisma as any).academic_activities.update({
    where: { id: activityId },
    data: {
      estatus: newStatus,
      updatedBy,
      updatedAt: new Date(),
    },
  });

  // Log to history
  await (prisma as any).activity_history.create({
    data: {
      id: randomUUID(),
      activityId,
      accion: 'STATUS_CHANGED',
      campoAnterior: 'estatus',
      valorAnterior: activity.estatus,
      valorNuevo: newStatus,
      realizadoPor: updatedBy,
    },
  });

  return updated;
};

/** Estados desde los que se puede cancelar (el alumno solo los tempranos) */
const STUDENT_CANCELABLE = ['LISTA_ESPERA', 'PENDIENTE_PAGO', 'INSCRITO'];
const TERMINAL_STATUSES = ['APROBADO', 'REPROBADO', 'EVALUADO', 'CANCELADO', 'BAJA', 'COMPLETADO'];

/**
 * Cancel an activity (exam or special course)
 * - STUDENT: solo sus propias solicitudes y solo en estados tempranos sin calificación.
 * - ADMIN: cualquier actividad no terminal, con motivo.
 * Revierte cupos: período de examen (consumido al crear) y grupo (consumido al quedar INSCRITO).
 */
export const cancelActivity = async (
  activityId: string,
  options: {
    cancelledBy?: string;
    role: 'STUDENT' | 'ADMIN';
    studentId?: string; // requerido para STUDENT (ownership)
    motivo?: string;
  }
) => {
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: {
      exams: true,
      special_courses: true,
    },
  });

  if (!activity || activity.deletedAt) {
    throw new Error('Actividad no encontrada');
  }

  if (TERMINAL_STATUSES.includes(activity.estatus)) {
    throw new Error(`No se puede cancelar una actividad en estado ${activity.estatus}`);
  }

  if (options.role === 'STUDENT') {
    if (!options.studentId || activity.studentId !== options.studentId) {
      throw new Error('Solo puedes cancelar tus propias solicitudes');
    }
    if (!STUDENT_CANCELABLE.includes(activity.estatus)) {
      throw new Error(`No puedes cancelar una solicitud en estado ${activity.estatus}`);
    }
    if (activity.exams?.resultado !== null && activity.exams?.resultado !== undefined) {
      throw new Error('No puedes cancelar un examen que ya tiene resultado');
    }
    if (activity.special_courses?.calificacion !== null && activity.special_courses?.calificacion !== undefined) {
      throw new Error('No puedes cancelar un curso que ya tiene calificación');
    }
  } else if (options.role === 'ADMIN' && !options.motivo) {
    throw new Error('El motivo es requerido para cancelar como administrador');
  }

  const motivo = options.motivo || 'Cancelado por el alumno';

  await prisma.$transaction(async (tx) => {
    // Reversa de cupo del período de examen (se consumió al crear la solicitud)
    if (activity.exams?.periodId) {
      const period = await (tx as any).diagnostic_exam_periods.findUnique({
        where: { id: activity.exams.periodId },
        select: { cupoActual: true },
      });
      if (period && period.cupoActual > 0) {
        await (tx as any).diagnostic_exam_periods.update({
          where: { id: activity.exams.periodId },
          data: { cupoActual: { decrement: 1 } },
        });
      }
    }

    // Reversa de cupo del grupo (solo se consumió si la inscripción quedó activa)
    if (activity.special_courses?.groupId && activity.estatus === 'INSCRITO') {
      const group = await (tx as any).groups.findUnique({
        where: { id: activity.special_courses.groupId },
        select: { cupoActual: true },
      });
      if (group && group.cupoActual > 0) {
        await (tx as any).groups.update({
          where: { id: activity.special_courses.groupId },
          data: { cupoActual: { decrement: 1 } },
        });
      }
    }

    await (tx as any).academic_activities.update({
      where: { id: activityId },
      data: {
        estatus: 'CANCELADO',
        fechaBaja: new Date(),
        observaciones: activity.observaciones
          ? `${activity.observaciones}\nCancelado: ${motivo}`
          : `Cancelado: ${motivo}`,
        updatedBy: options.cancelledBy,
        updatedAt: new Date(),
      },
    });

    await (tx as any).activity_history.create({
      data: {
        id: randomUUID(),
        activityId,
        accion: 'STATUS_CHANGED',
        campoAnterior: 'estatus',
        valorAnterior: activity.estatus,
        valorNuevo: 'CANCELADO',
        descripcion: motivo,
        realizadoPor: options.cancelledBy,
      },
    });
  });

  return {
    activityId,
    estatus: 'CANCELADO',
    estatusAnterior: activity.estatus,
  };
};

/**
 * Soft delete activity
 */
export const deleteActivity = async (activityId: string, deletedBy?: string) => {
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    throw new Error('Activity not found');
  }

  const deleted = await (prisma as any).academic_activities.update({
    where: { id: activityId },
    data: {
      deletedAt: new Date(),
      updatedBy: deletedBy,
      updatedAt: new Date(),
    },
  });

  // Log to history
  await (prisma as any).activity_history.create({
    data: {
      id: randomUUID(),
      activityId,
      accion: 'DELETED',
      realizadoPor: deletedBy,
    },
  });

  return deleted;
};


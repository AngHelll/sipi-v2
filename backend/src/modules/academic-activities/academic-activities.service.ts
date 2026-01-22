// Academic Activities Service - Base service for all academic activities
// V2: Servicio base para todas las actividades académicas
import { randomUUID } from 'crypto';
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


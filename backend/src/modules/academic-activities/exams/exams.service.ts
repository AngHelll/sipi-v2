// Exams Service - Business logic for exam activities
// V2: Servicio para exámenes (NO requiere grupo)
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../../db/client';
import prisma from '../../../config/database';
import { generateActivityCode, updateActivityStatus } from '../academic-activities.service';
import { recalculateStudentAverages } from '../../students/students.service';
import { ExamsValidators } from './exams.validators';
import { EntityValidators } from '../../../shared/validators/entity.validators';

/**
 * Create diagnostic exam
 * - Con periodId: inscripción a un período publicado → PENDIENTE_PAGO o INSCRITO según cobro.
 * - Sin periodId (primer diagnóstico): LISTA_ESPERA — el admin asigna período cuando abra uno.
 * - Sin periodId con diagnóstico previo (APROBADO/EVALUADO): no permitido; retoma solo vía período.
 * El nivel de placement NO se captura en la solicitud; lo define processExamResult.
 */
export const createDiagnosticExam = async (
  studentId: string,
  examType: 'DIAGNOSTICO' | 'ADMISION' | 'CERTIFICACION',
  subjectId?: string,
  periodId?: string
) => {
  // Validate student exists
  await EntityValidators.validateStudentExists(studentId);

  // Validate exam-specific rules
  await ExamsValidators.validateCanRequestExam(studentId, examType, periodId);

  // Validate subject if provided
  if (subjectId) {
    await EntityValidators.validateSubjectExists(subjectId);
  }

  // Retoma de diagnóstico: solo vía período publicado (puede tener costo)
  if (!periodId && examType === 'DIAGNOSTICO') {
    const priorDiagnostic = await (prisma as any).academic_activities.findFirst({
      where: {
        studentId,
        activityType: 'EXAM',
        deletedAt: null,
        estatus: { in: ['APROBADO', 'EVALUADO'] },
        exams: { examType: 'DIAGNOSTICO' },
      },
    });
    if (priorDiagnostic) {
      throw new Error(
        'Para un segundo examen de diagnóstico debes inscribirte a un período publicado (puede tener costo según el período).'
      );
    }
  }

  let periodRequiresPayment = false;
  let periodPaymentAmount: number | null = null;
  let initialStatus: string;

  if (periodId) {
    const { ExamPeriodsValidators } = await import('../exam-periods/exam-periods.validators');
    await ExamPeriodsValidators.validatePeriodOpen(periodId);
    await ExamPeriodsValidators.validateCapacity(periodId);

    const period = await (prisma as any).diagnostic_exam_periods.findUnique({
      where: { id: periodId },
      select: { requierePago: true, montoPago: true },
    });

    if (period) {
      periodRequiresPayment = period.requierePago || false;
      periodPaymentAmount = period.montoPago ? Number(period.montoPago) : null;
    }
    initialStatus = periodRequiresPayment ? 'PENDIENTE_PAGO' : 'INSCRITO';
  } else {
    initialStatus = 'LISTA_ESPERA';
    periodRequiresPayment = false;
  }

  // Generate codes
  const codigo = await generateActivityCode('EXAM');
  const activityId = randomUUID();
  const examId = randomUUID();

  // Create activity and exam in transaction with increased timeout
  const result = await prisma.$transaction(async (tx) => {
    // Create academic activity
    const activity = await (tx as any).academic_activities.create({
      data: {
        id: activityId,
        studentId,
        activityType: 'EXAM',
        codigo,
        estatus: initialStatus, // PENDIENTE_PAGO if payment required, INSCRITO otherwise
        fechaInscripcion: new Date(),
      },
    });

    // Create exam
    const exam = await (tx as any).exams.create({
      data: {
        id: examId,
        activityId: activity.id,
        examType,
        subjectId: subjectId || null,
        nivelIngles: null,
        periodId: periodId || null,
        requierePago: periodRequiresPayment,
        pagoAprobado: periodRequiresPayment ? null : true, // null if payment required, true if not
        montoPago: periodPaymentAmount,
      },
    });

    // Increment period capacity if period provided
    if (periodId) {
      const period = await (tx as any).diagnostic_exam_periods.findUnique({
        where: { id: periodId },
      });

      if (period) {
        await (tx as any).diagnostic_exam_periods.update({
          where: { id: periodId },
          data: {
            cupoActual: {
              increment: 1,
            },
          },
        });
      }
    }

    // Log to history
    await (tx as any).activity_history.create({
      data: {
        id: randomUUID(),
        activityId: activity.id,
        accion: 'CREATED',
        descripcion: periodId
          ? `Examen de ${examType} solicitado (período asignado${periodRequiresPayment ? ', pendiente de pago' : ''})`
          : `Examen de ${examType} agregado a lista de espera (sin período publicado)`,
      },
    });

    return { activity, exam };
  }, {
    maxWait: 10000,
    timeout: 15000,
  });

  return {
    id: result.activity.id,
    codigo: result.activity.codigo,
    estatus: result.activity.estatus,
    examType: result.exam.examType,
    periodId: result.exam.periodId || undefined,
    requierePago: result.exam.requierePago,
    montoPago: result.exam.montoPago ? Number(result.exam.montoPago) : undefined,
  };
};

/**
 * Assign an exam period to a waitlisted diagnostic exam (Admin only)
 */
export const assignPeriodToExam = async (
  activityId: string,
  periodId: string,
  assignedBy?: string
) => {
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: { exams: true },
  });

  if (!activity || !activity.exams) {
    throw new Error('Examen no encontrado');
  }

  if (activity.estatus !== 'LISTA_ESPERA') {
    throw new Error('Solo se puede asignar período a solicitudes en lista de espera');
  }

  if (activity.exams.periodId) {
    throw new Error('Esta solicitud ya tiene un período asignado');
  }

  const { ExamPeriodsValidators } = await import('../exam-periods/exam-periods.validators');
  await ExamPeriodsValidators.validatePeriodAssignableByAdmin(periodId);
  await ExamPeriodsValidators.validateCapacity(periodId);

  const period = await (prisma as any).diagnostic_exam_periods.findUnique({
    where: { id: periodId },
    select: { requierePago: true, montoPago: true },
  });

  const requierePago = period?.requierePago || false;
  const montoPago = period?.montoPago ? Number(period.montoPago) : null;
  const newStatus = requierePago ? 'PENDIENTE_PAGO' : 'INSCRITO';

  await prisma.$transaction(async (tx) => {
    await (tx as any).exams.update({
      where: { id: activity.exams.id },
      data: {
        periodId,
        requierePago,
        montoPago,
        pagoAprobado: requierePago ? null : true,
        fechaPagoAprobado: requierePago ? null : new Date(),
      },
    });

    await (tx as any).diagnostic_exam_periods.update({
      where: { id: periodId },
      data: { cupoActual: { increment: 1 } },
    });

    await (tx as any).activity_history.create({
      data: {
        id: randomUUID(),
        activityId,
        accion: 'UPDATED',
        descripcion: `Período asignado desde lista de espera${requierePago ? ' (pendiente de pago)' : ''}`,
        realizadoPor: assignedBy,
      },
    });
  });

  await updateActivityStatus(activityId, newStatus, assignedBy);

  return { activityId, periodId, estatus: newStatus, requierePago };
};

/**
 * Exam waitlist count (Admin only)
 */
export const getExamWaitlistSummary = async () => {
  const waitlisted = await (prisma as any).academic_activities.findMany({
    where: {
      activityType: 'EXAM',
      estatus: 'LISTA_ESPERA',
      deletedAt: null,
      exams: { examType: 'DIAGNOSTICO' },
    },
    include: {
      exams: { select: { examType: true } },
    },
  });

  return {
    total: waitlisted.length,
    byType: [{ examType: 'DIAGNOSTICO', count: waitlisted.length }],
  };
};

/**
 * Receive and approve exam payment (Admin only)
 * Admin receives physical payment proof and approves payment in one step
 */
export const receiveAndApproveExamPayment = async (
  activityId: string,
  montoPago: number,
  observaciones?: string,
  approvedBy?: string
) => {
  // Validate payment amount
  if (montoPago <= 0) {
    throw new Error('El monto del pago debe ser mayor a 0');
  }

  // Get activity and exam
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: {
      exams: true,
    },
  });

  if (!activity || !activity.exams) {
    throw new Error('Examen no encontrado');
  }

  if (activity.activityType !== 'EXAM') {
    throw new Error('Esta actividad no es un examen');
  }

  if (activity.estatus !== 'PENDIENTE_PAGO') {
    throw new Error('Este examen no está pendiente de pago');
  }

  if (!activity.exams.requierePago) {
    throw new Error('Este examen no requiere pago');
  }

  // Update exam with payment info and approve
  await (prisma as any).exams.update({
    where: { id: activity.exams.id },
    data: {
      montoPago,
      pagoAprobado: true,
      fechaPagoAprobado: new Date(),
    },
  });

  // Update activity status to INSCRITO (can now take exam)
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
    id: activity.id,
    codigo: activity.codigo,
    estatus: 'INSCRITO',
    pagoAprobado: true,
    montoPago,
  };
};

/**
 * Reject exam payment (Admin only)
 * Used when physical payment proof is invalid or incorrect
 */
export const rejectExamPayment = async (
  activityId: string,
  motivo: string,
  rejectedBy?: string
) => {
  // Get activity and exam
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: {
      exams: true,
    },
  });

  if (!activity || !activity.exams) {
    throw new Error('Examen no encontrado');
  }

  if (activity.activityType !== 'EXAM') {
    throw new Error('Esta actividad no es un examen');
  }

  if (activity.estatus !== 'PENDIENTE_PAGO') {
    throw new Error('Este examen debe estar pendiente de pago para rechazarlo');
  }

  // Update exam payment status
  await (prisma as any).exams.update({
    where: { id: activity.exams.id },
    data: {
      pagoAprobado: false,
      montoPago: null, // Clear payment amount
    },
  });

  // Update activity observations with rejection reason — el alumno puede cancelar y volver a solicitar
  await (prisma as any).academic_activities.update({
    where: { id: activityId },
    data: {
      observaciones: `Pago rechazado. Motivo: ${motivo}. Puedes cancelar esta solicitud y volver a inscribirte cuando tengas el comprobante correcto.`,
    },
  });

  // Log to history
  await (prisma as any).activity_history.create({
    data: {
      id: randomUUID(),
      activityId,
      accion: 'PAYMENT_REJECTED',
      descripcion: `Pago rechazado. Motivo: ${motivo}`,
      realizadoPor: rejectedBy,
    },
  });

  return {
    id: activity.id,
    codigo: activity.codigo,
    estatus: 'PENDIENTE_PAGO',
    pagoAprobado: false,
  };
};

/**
 * Get exam by activity ID
 */
export const getExamById = async (activityId: string) => {
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
    },
  });

  if (!activity || activity.activityType !== 'EXAM' || activity.deletedAt) {
    return null;
  }

  // Get period if periodId exists
  let period = null;
  if (activity.exams?.periodId) {
    period = await (prisma as any).diagnostic_exam_periods.findUnique({
      where: { id: activity.exams.periodId },
      select: {
        id: true,
        nombre: true,
      },
    });
  }

  return {
    id: activity.id,
    codigo: activity.codigo,
    estatus: activity.estatus,
    fechaInscripcion: activity.fechaInscripcion.toISOString(),
    student: activity.students ? {
      id: activity.students.id,
      matricula: activity.students.matricula,
      nombre: activity.students.nombre,
      apellidoPaterno: activity.students.apellidoPaterno,
      apellidoMaterno: activity.students.apellidoMaterno,
    } : null,
    exam: activity.exams ? {
      examType: activity.exams.examType,
      nivelIngles: activity.exams.nivelIngles,
      resultado: activity.exams.resultado ? Number(activity.exams.resultado) : null,
      fechaExamen: activity.exams.fechaExamen?.toISOString(),
      fechaResultado: activity.exams.fechaResultado?.toISOString(),
      periodId: activity.exams.periodId,
      period: period,
      subject: activity.exams.subjects,
    } : null,
  };
};

/**
 * Process exam result
 * Updates exam result and student level if applicable
 */
export const processExamResult = async (
  activityId: string,
  resultado: number,
  processedBy?: string,
  nivelIngles?: number,
  calificacionesPorNivel?: Record<number, number>
) => {
  // Validate grade
  if (resultado < 0 || resultado > 100) {
    throw new Error('El resultado debe estar entre 0 y 100');
  }

  // Get activity and exam
  const activity = await (prisma as any).academic_activities.findUnique({
    where: { id: activityId },
    include: {
      exams: true,
      students: true,
    },
  });

  if (!activity || !activity.exams) {
    throw new Error('Examen no encontrado');
  }

  if (activity.activityType !== 'EXAM') {
    throw new Error('Esta actividad no es un examen');
  }

  if (!['INSCRITO', 'EN_CURSO'].includes(activity.estatus)) {
    throw new Error(`No se puede calificar un examen en estado ${activity.estatus}`);
  }

  if (activity.exams.requierePago && activity.exams.pagoAprobado !== true) {
    throw new Error('No se puede calificar un examen con pago pendiente o rechazado');
  }

  if (activity.exams.resultado !== null && activity.exams.resultado !== undefined) {
    throw new Error('Este examen ya tiene resultado registrado');
  }

  const exam = activity.exams;

  // Update exam result and nivelIngles if provided
  const updateData: any = {
    resultado,
    fechaResultado: new Date(),
    fechaExamen: exam.fechaExamen || new Date(),
  };
  
  // If nivelIngles is provided (1-6), update it; 0 = skip a nivel 6 (no se guarda en exam)
  if (nivelIngles !== undefined && nivelIngles !== null && nivelIngles >= 1) {
    if (nivelIngles > 6) {
      throw new Error('El nivel de inglés debe estar entre 1 y 6');
    }
    updateData.nivelIngles = nivelIngles;
  }

  const updatedExam = await (prisma as any).exams.update({
    where: { id: exam.id },
    data: updateData,
  });

  // Update activity status
  // For diagnostic exams, use EVALUADO instead of REPROBADO for grades < 70
  // This is less harsh since it's an initial evaluation
  const newStatus = resultado >= 70 
    ? 'APROBADO' 
    : (exam.examType === 'DIAGNOSTICO' ? 'EVALUADO' : 'REPROBADO');
  await updateActivityStatus(activityId, newStatus, processedBy);

  // If diagnostic exam for English, update student level
  if (exam.examType === 'DIAGNOSTICO') {
    const explicitSkipToLevel6 = nivelIngles === 0 && resultado >= 70;

    if (explicitSkipToLevel6) {
      // Sin cursos fantasma: el alumno cursará el nivel 6 como curso real
      await prisma.students.update({
        where: { id: activity.studentId },
        data: {
          nivelInglesActual: 6,
          fechaExamenDiagnostico: new Date(),
          porcentajeIngles: resultado,
        },
      });
    } else {
      const placementNivel =
        nivelIngles !== undefined && nivelIngles !== null && nivelIngles >= 1
          ? nivelIngles
          : undefined;

      await ExamsValidators.updateStudentEnglishLevel(
        activity.studentId,
        resultado,
        placementNivel,
        calificacionesPorNivel
      );

      await recalculateStudentAverages(activity.studentId).catch((error: unknown) => {
        console.error('Error recalculating student averages after diagnostic exam:', error);
      });
    }
  } else {
    // Recalculate student averages for regular exams if applicable
    if (exam.subjectId) {
      await recalculateStudentAverages(activity.studentId).catch((error: unknown) => {
        console.error('Error recalculating student averages:', error);
      });
    }
  }

  // Log to history
  await (prisma as any).activity_history.create({
    data: {
      id: randomUUID(),
      activityId,
      accion: 'GRADE_UPDATED',
      campoAnterior: 'resultado',
      valorAnterior: exam.resultado?.toString() || null,
      valorNuevo: resultado.toString(),
      realizadoPor: processedBy,
    },
  });

  // Check if this is a perfect score (100%) on diagnostic exam
  const isPerfectScore = exam.examType === 'DIAGNOSTICO' && resultado === 100;
  
  // Check if level was skipped (0) for grade >= 70
  const levelSkipped = exam.examType === 'DIAGNOSTICO' && 
                       resultado >= 70 && 
                       (nivelIngles === 0 || nivelIngles === null || nivelIngles === undefined);
  
  let message: string | undefined = undefined;
  if (isPerfectScore) {
    message = 'El estudiante obtuvo 100% en el examen de diagnóstico. Todos los niveles de inglés (1-6) han sido completados automáticamente y el requisito de inglés ha sido marcado como cumplido.';
  } else if (levelSkipped) {
    message = 'Examen procesado exitosamente. El estudiante puede inscribirse al nivel 6 como curso real. No se crearon registros automáticos de niveles.';
  }
  
  return {
    activityId,
    resultado,
    estatus: newStatus,
    nivelIngles: updatedExam.nivelIngles,
    isPerfectScore, // Flag to indicate perfect score
    message,
  };
};

/**
 * Get exams by student (V2)
 * Returns all exams for a student using the new academic_activities structure
 */
export const getExamsByStudent = async (studentId: string) => {
  const activities = await (prisma as any).academic_activities.findMany({
    where: {
      studentId,
      activityType: 'EXAM',
      deletedAt: null,
    },
    include: {
      exams: {
        include: {
          subjects: {
            select: {
              id: true,
              clave: true,
              nombre: true,
            },
          },
          diagnostic_exam_periods: {
            select: {
              id: true,
              nombre: true,
              fechaInscripcionInicio: true,
              fechaInscripcionFin: true,
            },
          },
        },
      },
    },
    orderBy: {
      fechaInscripcion: 'desc',
    },
  });

  return {
    exams: activities.map((activity: any) => ({
      id: activity.id,
      codigo: activity.codigo,
      estatus: activity.estatus,
      fechaInscripcion: activity.fechaInscripcion.toISOString(),
      exam: activity.exams ? {
        examType: activity.exams.examType,
        nivelIngles: activity.exams.nivelIngles,
        resultado: activity.exams.resultado ? Number(activity.exams.resultado) : null,
        fechaExamen: activity.exams.fechaExamen?.toISOString(),
        fechaResultado: activity.exams.fechaResultado?.toISOString(),
        subject: activity.exams.subjects,
        period: activity.exams.diagnostic_exam_periods ? {
          id: activity.exams.diagnostic_exam_periods.id,
          nombre: activity.exams.diagnostic_exam_periods.nombre,
          fechaInscripcionInicio: activity.exams.diagnostic_exam_periods.fechaInscripcionInicio?.toISOString(),
          fechaInscripcionFin: activity.exams.diagnostic_exam_periods.fechaInscripcionFin?.toISOString(),
        } : null,
      } : null,
    })),
    total: activities.length,
  };
};

/**
 * Get student English status (V2)
 * Returns complete English status including V2 exams and special courses
 */
export const getStudentEnglishStatusV2 = async (studentId: string) => {
  // Get student info
  const student = await prisma.students.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      matricula: true,
      nombre: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      nivelInglesActual: true,
      nivelInglesCertificado: true,
      porcentajeIngles: true,
      promedioIngles: true,
      cumpleRequisitoIngles: true,
      fechaExamenDiagnostico: true,
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Get diagnostic exams (V2)
  const examActivities = await (prisma as any).academic_activities.findMany({
    where: {
      studentId,
      activityType: 'EXAM',
      deletedAt: null,
      exams: {
        examType: 'DIAGNOSTICO',
      },
    },
    include: {
      exams: {
        include: {
          subjects: {
            select: {
              id: true,
              clave: true,
              nombre: true,
            },
          },
          diagnostic_exam_periods: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
    },
    orderBy: {
      fechaInscripcion: 'desc',
    },
  });

  // Get English courses (V2 special_courses)
  const courseActivities = await (prisma as any).academic_activities.findMany({
    where: {
      studentId,
      activityType: 'SPECIAL_COURSE',
      deletedAt: null,
      special_courses: {
        courseType: 'INGLES',
      },
    },
    include: {
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
    },
    orderBy: {
      fechaInscripcion: 'desc',
    },
  });

  // Map diagnostic exams
  const diagnosticExams = examActivities.map((activity: any) => ({
    id: activity.id,
    codigo: activity.codigo,
    fechaInscripcion: activity.fechaInscripcion.toISOString(),
    estatus: activity.estatus,
    calificacion: activity.exams?.resultado ? Number(activity.exams.resultado) : null,
    nivelIngles: activity.exams?.nivelIngles || null,
    subject: activity.exams?.subjects?.nombre || 'Inglés',
    period: activity.exams?.diagnostic_exam_periods ? {
      id: activity.exams.diagnostic_exam_periods.id,
      nombre: activity.exams.diagnostic_exam_periods.nombre,
    } : null,
    fechaExamen: activity.exams?.fechaExamen?.toISOString() || null,
    fechaResultado: activity.exams?.fechaResultado?.toISOString() || null,
    requierePago: activity.exams?.requierePago || false,
    pagoAprobado: activity.exams?.pagoAprobado ?? null,
    montoPago: activity.exams?.montoPago ? Number(activity.exams.montoPago) : null,
    observaciones: activity.observaciones || null,
  }));

  // Map English courses
  // Filter out courses completed by diagnostic exam from the main list
  // These are kept in DB for average calculations but shouldn't appear as "real courses"
  const realCourses = courseActivities.filter((activity: any) => 
    !activity.special_courses?.completadoPorDiagnostico
  );

  const englishCourses = realCourses.map((activity: any) => ({
    id: activity.id,
    codigo: activity.codigo,
    nivelIngles: activity.special_courses?.nivelIngles || null,
    fechaInscripcion: activity.fechaInscripcion.toISOString(),
    estatus: activity.estatus,
    requierePago: activity.special_courses?.requierePago ?? false,
    pagoAprobado: activity.special_courses?.pagoAprobado ?? null,
    montoPago: activity.special_courses?.montoPago != null ? Number(activity.special_courses.montoPago) : null,
    calificacion: activity.special_courses?.calificacion ? Number(activity.special_courses.calificacion) : null,
    subject: activity.special_courses?.groups?.subjects?.nombre || 'Inglés',
    groupId: activity.special_courses?.groupId || null,
    observaciones: activity.observaciones || null,
    completadoPorDiagnostico: false, // Real courses are never completed by diagnostic
  }));

  // Get completed levels (from ALL approved courses, including diagnostic ones for calculation)
  // We need to include diagnostic courses for proper level tracking
  const allCompletedCourses = courseActivities.filter((activity: any) => 
    activity.estatus === 'APROBADO' && 
    activity.special_courses?.nivelIngles !== null &&
    activity.special_courses?.nivelIngles !== undefined
  );
  
  const completedLevels = allCompletedCourses
    .map((activity: any) => activity.special_courses.nivelIngles)
    .filter((level: number | null): level is number => level !== null)
    .sort((a: number, b: number) => a - b);

  // Determine missing levels (1-6)
  const allLevels = [1, 2, 3, 4, 5, 6];
  const missingLevels = allLevels.filter(level => !completedLevels.includes(level));

  // Get pending exam (inscrito but not taken yet, or pending payment)
  const pendingExamFound = diagnosticExams.find(
    (exam: {
      id: string;
      codigo: string;
      fechaInscripcion: string;
      estatus: string;
      calificacion: number | null;
      nivelIngles: number | null;
      subject: string;
      period: {
        id: string;
        nombre: string;
      } | null;
      fechaExamen: string | null;
      fechaResultado: string | null;
      requierePago: boolean;
      pagoAprobado: boolean | null;
      montoPago: number | null;
      observaciones?: string | null;
    }) => (exam.estatus === 'LISTA_ESPERA') ||
          (exam.estatus === 'INSCRITO' && exam.calificacion === null) ||
          (exam.estatus === 'PENDIENTE_PAGO') ||
          (exam.estatus === 'PAGO_PENDIENTE_APROBACION')
  );

  const pendingExam = pendingExamFound ? {
    id: pendingExamFound.id,
    codigo: pendingExamFound.codigo,
    fechaInscripcion: pendingExamFound.fechaInscripcion,
    estatus: pendingExamFound.estatus,
    period: pendingExamFound.period,
    requierePago: pendingExamFound.requierePago,
    pagoAprobado: pendingExamFound.pagoAprobado,
    montoPago: pendingExamFound.montoPago,
    observaciones: pendingExamFound.observaciones ?? null,
  } : null;

  // Recalculate English requirement status to ensure it's up-to-date
  // This considers both average (>=70%) AND all levels (1-6) completed
  const { StudentCalculators } = await import('../../students/students.validators');
  let englishRequirementStatus;
  try {
    englishRequirementStatus = await StudentCalculators.calculateEnglishRequirementStatus(studentId);
  } catch (error) {
    // Fallback to student's current status if calculation fails
    console.error('Error calculating English requirement status:', error);
    englishRequirementStatus = {
      cumpleRequisitoIngles: student.cumpleRequisitoIngles || false,
      promedioIngles: student.promedioIngles ? Number(student.promedioIngles) : null,
      nivelesCompletados: completedLevels,
      nivelesPendientes: missingLevels,
      progresoIngles: (completedLevels.length / 6) * 100,
      razonNoCumple: undefined,
    };
  }

  return {
    student: {
      id: student.id,
      matricula: student.matricula,
      nombre: student.nombre,
      apellidoPaterno: student.apellidoPaterno,
      apellidoMaterno: student.apellidoMaterno,
    },
    nivelInglesActual: student.nivelInglesActual,
    nivelInglesCertificado: student.nivelInglesCertificado,
    porcentajeIngles: student.porcentajeIngles ? Number(student.porcentajeIngles) : null,
    promedioIngles: englishRequirementStatus.promedioIngles,
    cumpleRequisitoIngles: englishRequirementStatus.cumpleRequisitoIngles,
    fechaExamenDiagnostico: student.fechaExamenDiagnostico?.toISOString() || null,
    diagnosticExams,
    englishCourses,
    completedLevels: englishRequirementStatus.nivelesCompletados,
    missingLevels: englishRequirementStatus.nivelesPendientes,
    pendingExam, // Exam that is enrolled but not yet taken
    progress: {
      totalLevels: 6,
      completed: englishRequirementStatus.nivelesCompletados.length,
      percentage: englishRequirementStatus.progresoIngles,
    },
    requirementDetails: {
      razonNoCumple: englishRequirementStatus.razonNoCumple,
    },
  };
};

/**
 * Get all exams with filters and pagination (Admin only)
 */
export const getAllExams = async (query: {
  page?: number;
  limit?: number;
  studentId?: string;
  periodId?: string;
  examType?: string;
  estatus?: string;
  fechaInicio?: string;
  fechaFin?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) => {
  const {
    page = 1,
    limit = 20,
    studentId,
    periodId,
    examType,
    estatus,
    fechaInicio,
    fechaFin,
    sortBy = 'fechaInscripcion',
    sortOrder = 'desc',
  } = query;

  // Tipado fuerte del filtro: si alguien vuelve a escribir `exams: { some }`
  // sobre esta relación uno-a-uno, ahora es error de compilación (no un 400 en runtime).
  const where: Prisma.academic_activitiesWhereInput = {
    activityType: 'EXAM',
    deletedAt: null,
  };

  if (studentId) where.studentId = studentId;
  if (estatus) where.estatus = estatus as Prisma.academic_activitiesWhereInput['estatus'];
  if (fechaInicio || fechaFin) {
    const fecha: Prisma.DateTimeFilter = {};
    if (fechaInicio) fecha.gte = new Date(fechaInicio);
    if (fechaFin) fecha.lte = new Date(fechaFin);
    where.fechaInscripcion = fecha;
  }

  const examWhere: Prisma.examsWhereInput = {};
  if (periodId) examWhere.periodId = periodId;
  if (examType) examWhere.examType = examType as Prisma.examsWhereInput['examType'];

  if (Object.keys(examWhere).length > 0) {
    // academic_activities.exams es relación uno-a-uno (exams?): filtro directo (`is`),
    // nunca `some` (que solo aplica a relaciones de lista).
    where.exams = examWhere;
  }

  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100);

  const orderBy = { [sortBy]: sortOrder } as Prisma.academic_activitiesOrderByWithRelationInput;

  const total = await (prisma as any).academic_activities.count({ where });

  const activities = await (prisma as any).academic_activities.findMany({
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
          diagnostic_exam_periods: {
            select: {
              id: true,
              nombre: true,
              fechaInscripcionInicio: true,
              fechaInscripcionFin: true,
            },
          },
        },
      },
    },
  });

  const exams = activities.map((activity: any) => ({
    id: activity.id,
    codigo: activity.codigo,
    estatus: activity.estatus,
    fechaInscripcion: activity.fechaInscripcion.toISOString(),
    student: activity.students
      ? {
          id: activity.students.id,
          matricula: activity.students.matricula,
          nombre: activity.students.nombre,
          apellidoPaterno: activity.students.apellidoPaterno,
          apellidoMaterno: activity.students.apellidoMaterno,
        }
      : null,
    exam: activity.exams
      ? {
          id: activity.exams.id,
          examType: activity.exams.examType,
          nivelIngles: activity.exams.nivelIngles,
          resultado: activity.exams.resultado ? Number(activity.exams.resultado) : undefined,
          fechaExamen: activity.exams.fechaExamen?.toISOString(),
          fechaResultado: activity.exams.fechaResultado?.toISOString(),
          requierePago: activity.exams.requierePago,
          pagoAprobado: activity.exams.pagoAprobado,
          montoPago: activity.exams.montoPago ? Number(activity.exams.montoPago) : undefined,
          subject: activity.exams.subjects,
          period: activity.exams.diagnostic_exam_periods
            ? {
                id: activity.exams.diagnostic_exam_periods.id,
                nombre: activity.exams.diagnostic_exam_periods.nombre,
                fechaInscripcionInicio: activity.exams.diagnostic_exam_periods.fechaInscripcionInicio?.toISOString(),
                fechaInscripcionFin: activity.exams.diagnostic_exam_periods.fechaInscripcionFin?.toISOString(),
              }
            : undefined,
        }
      : undefined,
  }));

  return {
    exams,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

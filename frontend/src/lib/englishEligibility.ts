/** Estados terminales / inactivos para elegibilidad de solicitudes de inglés */

const TERMINAL_EXAM_STATUSES = ['REPROBADO', 'EVALUADO', 'APROBADO', 'CANCELADO', 'BAJA'] as const;
const TERMINAL_COURSE_STATUSES = ['REPROBADO', 'BAJA', 'CANCELADO'] as const;

export interface StudentEnglishStatusSnapshot {
  cumpleRequisitoIngles: boolean;
  nivelInglesActual: number | null;
  pendingExam: { estatus: string } | null;
  diagnosticExams: Array<{ estatus: string }>;
  englishCourses: Array<{ estatus: string; nivelIngles: number | null }>;
}

export function getEligibleCourseLevel(status: StudentEnglishStatusSnapshot): number {
  return status.nivelInglesActual ?? 1;
}

export function hasActiveDiagnosticExam(status: StudentEnglishStatusSnapshot): boolean {
  if (status.pendingExam) {
    return true;
  }
  return status.diagnosticExams.some((e) => !TERMINAL_EXAM_STATUSES.includes(e.estatus as typeof TERMINAL_EXAM_STATUSES[number]));
}

export function hasPriorDiagnosticExam(status: StudentEnglishStatusSnapshot): boolean {
  return status.diagnosticExams.some((e) => e.estatus === 'APROBADO' || e.estatus === 'EVALUADO');
}

export function hasActiveCourseAtLevel(status: StudentEnglishStatusSnapshot, level: number): boolean {
  return status.englishCourses.some(
    (c) => c.nivelIngles === level && !TERMINAL_COURSE_STATUSES.includes(c.estatus as typeof TERMINAL_COURSE_STATUSES[number])
  );
}

export function getExamEligibility(status: StudentEnglishStatusSnapshot): {
  canRequest: boolean;
  reason?: string;
  hasPriorDiagnostic: boolean;
} {
  const hasPriorDiagnostic = hasPriorDiagnosticExam(status);

  if (status.cumpleRequisitoIngles) {
    return {
      canRequest: false,
      hasPriorDiagnostic,
      reason: 'Ya cumpliste los requisitos de inglés. No necesitas más exámenes de diagnóstico.',
    };
  }

  if (hasActiveDiagnosticExam(status)) {
    const activeStatus =
      status.pendingExam?.estatus ||
      status.diagnosticExams.find((e) => !TERMINAL_EXAM_STATUSES.includes(e.estatus as typeof TERMINAL_EXAM_STATUSES[number]))
        ?.estatus;
    const messages: Record<string, string> = {
      LISTA_ESPERA: 'Ya estás en lista de espera para un examen de diagnóstico.',
      PENDIENTE_PAGO: 'Ya tienes un examen de diagnóstico pendiente de pago.',
      INSCRITO: 'Ya estás inscrito a un examen de diagnóstico.',
      EN_CURSO: 'Ya estás presentando un examen de diagnóstico.',
      PAGO_PENDIENTE_APROBACION: 'Ya tienes un pago de examen en revisión.',
    };
    return {
      canRequest: false,
      hasPriorDiagnostic,
      reason: (activeStatus && messages[activeStatus]) || 'Ya tienes una solicitud de examen activa.',
    };
  }

  return { canRequest: true, hasPriorDiagnostic };
}

export function getCourseEligibility(status: StudentEnglishStatusSnapshot): {
  canRequest: boolean;
  reason?: string;
  level: number;
} {
  const level = getEligibleCourseLevel(status);

  if (status.cumpleRequisitoIngles) {
    return {
      canRequest: false,
      level,
      reason: 'Ya cumpliste los requisitos de inglés.',
    };
  }

  if (hasActiveCourseAtLevel(status, level)) {
    const active = status.englishCourses.find(
      (c) => c.nivelIngles === level && !TERMINAL_COURSE_STATUSES.includes(c.estatus as typeof TERMINAL_COURSE_STATUSES[number])
    );
    const messages: Record<string, string> = {
      LISTA_ESPERA: `Ya estás en lista de espera para el nivel ${level}.`,
      PENDIENTE_PAGO: `Ya tienes un curso de nivel ${level} pendiente de pago.`,
      INSCRITO: `Ya estás inscrito al nivel ${level}.`,
      EN_CURSO: `Ya estás cursando el nivel ${level}.`,
      APROBADO: `Ya completaste el nivel ${level}.`,
    };
    return {
      canRequest: false,
      level,
      reason: (active && messages[active.estatus]) || `Ya tienes una solicitud activa en el nivel ${level}.`,
    };
  }

  return { canRequest: true, level };
}

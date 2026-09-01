// Legacy English data stored on `enrollments` before academic_activities (RB-038).
// Excluded from list endpoints; English flows use /api/academic-activities only.

import { Prisma } from '@/db/client';

export const LEGACY_ENGLISH_ENROLLMENT_FILTER: Prisma.enrollmentsWhereInput = {
  NOT: {
    OR: [
      { esExamenDiagnostico: true },
      { tipoInscripcion: 'EXAMEN_DIAGNOSTICO' },
      { tipoInscripcion: 'CURSO_INGLES' },
    ],
  },
};

export const ENGLISH_INSCRIPTION_TYPES = ['EXAMEN_DIAGNOSTICO', 'CURSO_INGLES'] as const;

export const ENGLISH_VIA_ACTIVITIES_MESSAGE =
  'Las inscripciones de inglés se gestionan en /api/academic-activities (exams o special-courses).';

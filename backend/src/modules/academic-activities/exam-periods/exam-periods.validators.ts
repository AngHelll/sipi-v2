// Exam Periods Validators - Business rules for exam periods

/**
 * ExamPeriodsValidators
 * 
 * Contains all business rule validations specific to exam periods.
 */
export class ExamPeriodsValidators {
  /**
   * Validate that dates are logical
   * - fechaInscripcionInicio < fechaInscripcionFin
   * - fechaInscripcionFin < fechaInicio (inscriptions should close before exams start)
   * - fechaInicio < fechaFin
   */
  static validateDates(
    fechaInicio: string,
    fechaFin: string,
    fechaInscripcionInicio: string,
    fechaInscripcionFin: string
  ): void {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const inscripcionInicio = new Date(fechaInscripcionInicio);
    const inscripcionFin = new Date(fechaInscripcionFin);

    // Validate inscription dates
    if (inscripcionInicio >= inscripcionFin) {
      throw new Error('La fecha de inicio de inscripciones debe ser anterior a la fecha de fin');
    }

    // Validate exam dates
    if (inicio >= fin) {
      throw new Error('La fecha de inicio del período debe ser anterior a la fecha de fin');
    }

    // Inscriptions should close before exams start (or at least on the same day)
    if (inscripcionFin > inicio) {
      throw new Error('Las inscripciones deben cerrar antes o el mismo día que inician los exámenes');
    }

    // Inscriptions should start before exam period starts
    if (inscripcionInicio > inicio) {
      throw new Error('Las inscripciones deben iniciar antes del período de exámenes');
    }
  }

  /**
   * Validate that period has available capacity
   */
  static async validateCapacity(periodId: string): Promise<void> {
    const prisma = require('../../../config/database').default;
    const period = await (prisma as any).diagnostic_exam_periods.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new Error('Período de exámenes no encontrado');
    }

    if (period.cupoActual >= period.cupoMaximo) {
      throw new Error('El período de exámenes está lleno');
    }
  }

  /**
   * Validate that period is open for inscriptions
   */
  static async validatePeriodOpen(periodId: string): Promise<void> {
    const prisma = require('../../../config/database').default;
    const period = await (prisma as any).diagnostic_exam_periods.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new Error('Período de exámenes no encontrado');
    }

    if (period.estatus !== 'ABIERTO') {
      throw new Error('El período de exámenes no está abierto para inscripciones');
    }

    const now = new Date();
    if (now < period.fechaInscripcionInicio || now > period.fechaInscripcionFin) {
      throw new Error('El período de inscripciones no está activo en este momento');
    }
  }
}



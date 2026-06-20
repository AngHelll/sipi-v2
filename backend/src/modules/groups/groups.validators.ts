// Group validators - Business rules validations
import { EntityValidators } from '../../shared/validators/entity.validators';

/**
 * GroupValidators
 * 
 * Contains all business rule validations for groups.
 * Each validator is a static method that can be tested independently.
 * 
 * Uses shared validators from EntityValidators for common validations.
 */
export class GroupValidators {
  /**
   * Validate that subject exists
   * Uses shared EntityValidators.validateSubjectExists
   * 
   * @param subjectId - ID of the subject to validate
   * @throws Error if subject not found
   */
  static async validateSubjectExists(subjectId: string): Promise<void> {
    await EntityValidators.validateSubjectExists(subjectId);
  }

  /**
   * Validate that teacher exists
   * Uses shared EntityValidators.validateTeacherExists
   * 
   * @param teacherId - ID of the teacher to validate
   * @throws Error if teacher not found
   */
  static async validateTeacherExists(teacherId: string): Promise<void> {
    await EntityValidators.validateTeacherExists(teacherId);
  }

  /**
   * Validate that group exists
   * Uses shared EntityValidators.validateGroupExists
   * 
   * @param groupId - ID of the group to validate
   * @throws Error if group not found
   */
  static async validateGroupExists(groupId: string): Promise<void> {
    await EntityValidators.validateGroupExists(groupId);
  }

  /**
   * Validate that an English group has a valid level (1-6).
   *
   * Un grupo marcado como de inglés (`esCursoIngles = true`) debe tener
   * `nivelIngles` definido y en rango 1-6. De lo contrario el alumno nunca
   * lo verá (las pantallas de solicitud filtran por nivel) y el placement
   * queda ambiguo.
   *
   * @param esCursoIngles - Bandera de curso de inglés (estado efectivo)
   * @param nivelIngles - Nivel del grupo (estado efectivo)
   * @throws Error si es curso de inglés sin nivel válido
   */
  static validateEnglishLevel(
    esCursoIngles: boolean | null | undefined,
    nivelIngles: number | null | undefined
  ): void {
    if (!esCursoIngles) return;
    const fail = (message: string): never => {
      const err = new Error(message) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    };
    if (nivelIngles === null || nivelIngles === undefined) {
      fail('Un grupo de inglés debe tener un nivel asignado (1-6).');
    }
    if (!Number.isInteger(nivelIngles) || (nivelIngles as number) < 1 || (nivelIngles as number) > 6) {
      fail('El nivel de inglés del grupo debe ser un entero entre 1 y 6.');
    }
  }

  /**
   * Regla canónica de "grupo de inglés disponible para solicitar/inscribirse".
   *
   * Fuente única de verdad compartida por el listado del alumno
   * (`getAvailableEnglishCourses`) y la validación del POST de solicitud
   * (`SpecialCoursesValidators.validateGroupMatchesCourse`), para que lo que
   * el alumno ve sea exactamente lo que puede solicitar.
   *
   * Un grupo es solicitable si:
   * - no está eliminado (`deletedAt = null`)
   * - su `estatus` es `ABIERTO` (no `EN_CURSO`, `CERRADO`, etc.)
   * - la ventana de inscripción está vigente (o sin fechas)
   * - tiene cupo disponible (`cupoActual < cupoMaximo`)
   *
   * No evalúa `esCursoIngles` ni el nivel: eso lo verifica quien llama
   * (el listado filtra por `esCursoIngles`, el validador hace match de nivel).
   */
  static englishGroupAvailability(
    group: {
      estatus?: string | null;
      deletedAt?: Date | null;
      cupoActual?: number | null;
      cupoMaximo?: number | null;
      fechaInscripcionInicio?: Date | null;
      fechaInscripcionFin?: Date | null;
    },
    now: Date = new Date()
  ): { available: boolean; reason: string | null } {
    if (group.deletedAt) {
      return { available: false, reason: 'El grupo ya no está disponible.' };
    }
    if (group.estatus !== 'ABIERTO') {
      return {
        available: false,
        reason: `El grupo no está disponible para inscripciones (estatus: ${group.estatus ?? 'desconocido'}).`,
      };
    }
    if (group.fechaInscripcionInicio && group.fechaInscripcionInicio.getTime() > now.getTime()) {
      return { available: false, reason: 'Las inscripciones para este grupo aún no abren.' };
    }
    if (group.fechaInscripcionFin && group.fechaInscripcionFin.getTime() < now.getTime()) {
      return { available: false, reason: 'El período de inscripciones para este grupo ya cerró.' };
    }
    const cupoActual = group.cupoActual ?? 0;
    const cupoMaximo = group.cupoMaximo ?? 0;
    if (cupoActual >= cupoMaximo) {
      return { available: false, reason: 'El grupo seleccionado ya no tiene cupos disponibles.' };
    }
    return { available: true, reason: null };
  }
}


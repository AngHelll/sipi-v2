// Student validators - Business rules validations
import prisma from '../../config/database';
import { EntityValidators } from '../../shared/validators/entity.validators';
import { isEnglishSubject } from '../../shared/utils/subject.utils';

/**
 * StudentValidators
 * 
 * Contains all business rule validations for students.
 * Each validator is a static method that can be tested independently.
 * 
 * Uses shared validators from EntityValidators for common validations.
 */
export class StudentValidators {
  /**
   * Validate that username doesn't already exist
   * Uses shared EntityValidators.validateUsernameUnique
   * 
   * @param username - Username to validate
   * @throws Error if username already exists
   */
  static async validateUsernameUnique(username: string): Promise<void> {
    return EntityValidators.validateUsernameUnique(username);
  }

  /**
   * Validate that matricula doesn't already exist
   * 
   * @param matricula - Matricula to validate
   * @throws Error if matricula already exists
   */
  static async validateMatriculaUnique(matricula: string): Promise<void> {
    const existingStudent = await prisma.students.findUnique({
      where: { matricula },
    });

    if (existingStudent) {
      throw new Error('Matrícula already exists');
    }
  }

  /**
   * Validate that student exists
   * Uses shared EntityValidators.validateStudentExists
   * 
   * @param studentId - ID of the student to validate
   * @throws Error if student not found
   */
  static async validateStudentExists(studentId: string): Promise<void> {
    await EntityValidators.validateStudentExists(studentId);
  }
}

/**
 * StudentCalculators
 * 
 * Contains business logic for automatic calculations for students.
 * These are separated from validators because they transform data, not just validate it.
 * 
 * RB-037: La calificación de inglés es independiente de la calificación general
 */
export class StudentCalculators {
  /**
   * RB-037: Calculate promedioGeneral (excluding English subjects)
   * 
   * Business Rule: El promedio general se calcula excluyendo las materias de inglés.
   * Las materias de inglés se identifican por:
   * - Clave que inicia con "ING-", "LE-", "EN-", "ENG-"
   * - Nombre que contiene "inglés", "ingles", "english" (case insensitive)
   * 
   * @param enrollments - Array of enrollments with grades and subject information
   * @returns Calculated promedioGeneral or undefined if no valid grades
   */
  static calculatePromedioGeneral(
    enrollments: Array<{
      calificacionFinal?: number | null;
      calificacion?: number | null;
      group?: {
        subject?: {
          clave?: string | null;
          nombre?: string | null;
        } | null;
      } | null;
    }>
  ): number | undefined {
    const grades: number[] = [];

    for (const enrollment of enrollments) {
      // Get the grade (prefer calificacionFinal, fallback to calificacion)
      const grade = enrollment.calificacionFinal ?? enrollment.calificacion;
      
      // Skip if no grade
      if (grade === null || grade === undefined) {
        continue;
      }

      // Get subject information
      const subject = enrollment.group?.subject;
      if (!subject) {
        continue;
      }

      // Skip English subjects (RB-037)
      if (isEnglishSubject(subject.clave, subject.nombre)) {
        continue;
      }

      grades.push(Number(grade));
    }

    if (grades.length === 0) {
      return undefined;
    }

    // Calculate average
    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    const average = sum / grades.length;

    // Round to 2 decimal places
    return Math.round(average * 100) / 100;
  }

  /**
   * RB-037: Calculate promedioIngles (only English subjects)
   * 
   * Business Rule: El promedio de inglés se calcula solo con las materias de inglés.
   * Las materias de inglés se identifican por:
   * - Clave que inicia con "ING-", "LE-", "EN-", "ENG-"
   * - Nombre que contiene "inglés", "ingles", "english" (case insensitive)
   * 
   * @param enrollments - Array of enrollments with grades and subject information
   * @returns Calculated promedioIngles or undefined if no English grades
   */
  static calculatePromedioIngles(
    enrollments: Array<{
      calificacionFinal?: number | null;
      calificacion?: number | null;
      group?: {
        subject?: {
          clave?: string | null;
          nombre?: string | null;
        } | null;
      } | null;
    }>
  ): number | undefined {
    const grades: number[] = [];

    for (const enrollment of enrollments) {
      // Get the grade (prefer calificacionFinal, fallback to calificacion)
      const grade = enrollment.calificacionFinal ?? enrollment.calificacion;
      if (grade === null || grade === undefined) {
        continue;
      }

      const subject = enrollment.group?.subject;
      if (!subject) {
        continue;
      }

      if (isEnglishSubject(subject.clave, subject.nombre)) {
        grades.push(Number(grade));
      }
    }

    if (grades.length === 0) {
      return undefined;
    }

    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    const average = sum / grades.length;
    return Math.round(average * 100) / 100;
  }

  /**
   * RB-038: Calculate English requirement status
   * 
   * Business Rule: Un estudiante cumple el requisito de inglés solo si:
   * 1. Tiene un promedio de inglés >= 70%
   * 2. Ha completado y aprobado TODOS los niveles requeridos (1-6)
   * 
   * @param studentId - ID of the student
   * @returns Object with requirement status and details
   */
  static async calculateEnglishRequirementStatus(studentId: string): Promise<{
    cumpleRequisitoIngles: boolean;
    promedioIngles: number | null;
    nivelesCompletados: number[];
    nivelesPendientes: number[];
    progresoIngles: number; // Percentage of levels completed (0-100)
    razonNoCumple?: string; // Reason if requirement not met
  }> {
    const REQUIRED_LEVELS = [1, 2, 3, 4, 5, 6];
    const MINIMUM_AVERAGE = 70;

    // Get student with English courses
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: {
        promedioIngles: true,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get all approved English courses (all completed levels)
    const englishCourses = await (prisma as any).academic_activities.findMany({
      where: {
        studentId,
        activityType: 'SPECIAL_COURSE',
        deletedAt: null,
        estatus: 'APROBADO',
        special_courses: {
          courseType: 'INGLES',
          nivelIngles: { not: null },
        },
      },
      include: {
        special_courses: {
          select: {
            nivelIngles: true,
          },
        },
      },
    });

    // Extract completed levels
    const nivelesCompletados: number[] = englishCourses
      .map((activity: any) => activity.special_courses?.nivelIngles)
      .filter((level: number | null | undefined): level is number => 
        level !== null && level !== undefined && level >= 1 && level <= 6
      )
      .sort((a: number, b: number) => a - b);

    // Remove duplicates
    const nivelesCompletadosUnicos = Array.from(new Set(nivelesCompletados));

    // Determine missing levels
    const nivelesPendientes = REQUIRED_LEVELS.filter(
      level => !nivelesCompletadosUnicos.includes(level)
    );

    // Calculate progress percentage
    const progresoIngles = Math.round(
      (nivelesCompletadosUnicos.length / REQUIRED_LEVELS.length) * 100
    );

    // Get average (use student's promedioIngles or calculate from courses)
    const promedioIngles = student.promedioIngles 
      ? Number(student.promedioIngles) 
      : null;

    // Determine if requirement is met
    const tienePromedioSuficiente = promedioIngles !== null && promedioIngles >= MINIMUM_AVERAGE;
    const tieneTodosLosNiveles = nivelesPendientes.length === 0;

    const cumpleRequisitoIngles = tienePromedioSuficiente && tieneTodosLosNiveles;

    // Determine reason if requirement not met
    let razonNoCumple: string | undefined;
    if (!cumpleRequisitoIngles) {
      if (!tienePromedioSuficiente && !tieneTodosLosNiveles) {
        razonNoCumple = `Promedio insuficiente (${promedioIngles?.toFixed(2) || 'N/A'}%) y faltan ${nivelesPendientes.length} nivel(es)`;
      } else if (!tienePromedioSuficiente) {
        razonNoCumple = `Promedio insuficiente: ${promedioIngles?.toFixed(2) || 'N/A'}% (requiere ≥70%)`;
      } else if (!tieneTodosLosNiveles) {
        razonNoCumple = `Faltan ${nivelesPendientes.length} nivel(es): ${nivelesPendientes.join(', ')}`;
      }
    }

    return {
      cumpleRequisitoIngles,
      promedioIngles,
      nivelesCompletados: nivelesCompletadosUnicos,
      nivelesPendientes,
      progresoIngles,
      razonNoCumple,
    };
  }
}

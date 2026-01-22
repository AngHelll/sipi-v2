// Special Courses Validators - Business rules for special courses
// V2: Validadores específicos para cursos especiales
import prisma from '../../../config/database';
import { EntityValidators } from '../../../shared/validators/entity.validators';
import { StudentCalculators } from '../../students/students.validators';

/**
 * SpecialCoursesValidators
 * 
 * Contains all business rule validations specific to special courses.
 */
export class SpecialCoursesValidators {
  /**
   * Validate that student can request English course
   * 
   * @param studentId - ID of the student
   * @param courseLevel - Level of the course (1-6)
   * @throws Error if validation fails
   */
  static async validateCanRequestEnglishCourse(
    studentId: string,
    courseLevel: number
  ): Promise<void> {
    // Get student info
    const student = await EntityValidators.validateStudentExists(studentId);

    // Check if student has already completed all English requirements
    const englishRequirementStatus = await StudentCalculators.calculateEnglishRequirementStatus(studentId);
    
    if (englishRequirementStatus.cumpleRequisitoIngles) {
      throw new Error(
        'Ya has cumplido con todos los requisitos de inglés. Has completado todos los niveles (1-6) con un promedio aprobatorio. No es necesario inscribirte a más cursos de inglés.'
      );
    }

    /**
     * Regla de negocio:
     * - Si el alumno NO tiene examen diagnóstico:
     *   - Puede inscribirse a NIVEL 1 (inicio desde cero).
     *   - NO puede inscribirse a niveles > 1.
     */
    if (!student.nivelInglesActual) {
      if (courseLevel > 1) {
        throw new Error(
          'Debes realizar el examen de diagnóstico antes de inscribirte a un curso de inglés de nivel superior a 1.'
        );
      }
      // Nivel 1 sin diagnóstico: permitido, saltamos el resto de validaciones que dependen del nivel actual
      return;
    }

    // Check if student already completed this level
    const completedLevel = await (prisma as any).academic_activities.findFirst({
      where: {
        studentId,
        activityType: 'SPECIAL_COURSE',
        deletedAt: null,
        estatus: 'APROBADO',
        special_courses: {
          courseType: 'INGLES',
          nivelIngles: courseLevel,
        },
      },
    });

    if (completedLevel) {
      throw new Error(`Ya has completado el nivel ${courseLevel} de inglés. No puedes inscribirte nuevamente.`);
    }

    // Validate course level matches student's current level
    // Business Rule: Student can only enroll in their current level (not superior or inferior)
    if (courseLevel !== student.nivelInglesActual!) {
      if (courseLevel < student.nivelInglesActual!) {
        throw new Error(`No puedes inscribirte a un nivel inferior (${courseLevel}) a tu nivel actual (${student.nivelInglesActual}). Solo puedes inscribirte al nivel ${student.nivelInglesActual}.`);
      } else {
        throw new Error(`No puedes inscribirte a un nivel superior (${courseLevel}) a tu nivel actual (${student.nivelInglesActual}). Solo puedes inscribirte al nivel ${student.nivelInglesActual}.`);
      }
    }

    // Check if student already has an active enrollment for this level (any status except REPROBADO, BAJA, CANCELADO)
    const activeEnrollment = await (prisma as any).academic_activities.findFirst({
      where: {
        studentId,
        activityType: 'SPECIAL_COURSE',
        deletedAt: null,
        estatus: {
          notIn: ['REPROBADO', 'BAJA', 'CANCELADO'],
        },
        special_courses: {
          courseType: 'INGLES',
          nivelIngles: courseLevel,
        },
      },
    });

    if (activeEnrollment) {
      const statusMessages: Record<string, string> = {
        'INSCRITO': 'Ya estás inscrito',
        'EN_CURSO': 'Ya estás cursando',
        'PENDIENTE_PAGO': 'Ya tienes una solicitud pendiente de pago',
        'PAGO_PENDIENTE_APROBACION': 'Ya tienes una solicitud de pago pendiente de aprobación',
        'APROBADO': 'Ya completaste',
      };
      const statusMessage = statusMessages[activeEnrollment.estatus] || 'Ya tienes una solicitud activa';
      throw new Error(`${statusMessage} para el nivel ${courseLevel} de inglés. No puedes inscribirte nuevamente.`);
    }

    // If groupId is provided, check if student is already enrolled in that specific group
    // This check will be done in the service layer where groupId is available
  }

  /**
   * Validate that student is not already enrolled in a specific group
   * 
   * @param studentId - ID of the student
   * @param groupId - ID of the group
   * @throws Error if student is already enrolled in the group
   */
  static async validateNotEnrolledInGroup(
    studentId: string,
    groupId: string
  ): Promise<void> {
    const existingEnrollment = await (prisma as any).academic_activities.findFirst({
      where: {
        studentId,
        activityType: 'SPECIAL_COURSE',
        deletedAt: null,
        estatus: {
          notIn: ['REPROBADO', 'BAJA', 'CANCELADO'],
        },
        special_courses: {
          groupId: groupId,
        },
      },
    });

    if (existingEnrollment) {
      throw new Error('Ya estás inscrito en este curso. No puedes inscribirte dos veces al mismo curso.');
    }
  }

  /**
   * Update student English certification after course completion
   * 
   * @param studentId - ID of the student
   * @param completedLevel - Level that was completed
   * @param finalGrade - Final grade in the course
   */
  static async updateStudentEnglishCertification(
    studentId: string,
    completedLevel: number,
    finalGrade: number
  ): Promise<void> {
    const student = await EntityValidators.validateStudentExists(studentId);

    // Update certificado level if this is the highest level completed
    const shouldUpdateCertificado = !student.nivelInglesCertificado || 
                                    completedLevel > student.nivelInglesCertificado;

    if (shouldUpdateCertificado) {
      await prisma.students.update({
        where: { id: studentId },
        data: {
          nivelInglesCertificado: completedLevel,
          porcentajeIngles: finalGrade,
          cumpleRequisitoIngles: finalGrade >= 70,
        },
      });
    }
  }
}


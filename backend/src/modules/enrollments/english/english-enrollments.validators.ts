// English enrollments validators - Business rules validations for English enrollments
// RB-038: Validaciones específicas para inscripciones de inglés
import prisma from '../../../config/database';
import { EntityValidators } from '../../../shared/validators/entity.validators';
import { isEnglishSubject } from '../../../shared/utils/subject.utils';

/**
 * EnglishEnrollmentsValidators
 * 
 * Contains all business rule validations specific to English enrollments (RB-038).
 * These validators handle:
 * - Examen de diagnóstico (gratis, auto-aprobado)
 * - Cursos de inglés (requieren pago y aprobación)
 * - Niveles de inglés
 * - Requisito de 70% mínimo
 */
export class EnglishEnrollmentsValidators {
  /**
   * RB-038.1: Validate that student can request diagnostic exam
   * 
   * Business Rule: 
   * - El estudiante no debe tener un examen de diagnóstico pendiente
   * - El examen de diagnóstico es gratis
   * 
   * @param studentId - ID of the student
   * @throws Error if student has pending diagnostic exam
   */
  static async validateCanRequestDiagnosticExam(studentId: string): Promise<void> {
    // Check if student has a pending diagnostic exam
    const pendingExam = await prisma.enrollments.findFirst({
      where: {
        studentId,
        esExamenDiagnostico: true,
        deletedAt: null,
        estatus: {
          in: ['INSCRITO', 'EN_CURSO', 'PENDIENTE_PAGO', 'PAGO_PENDIENTE_APROBACION'],
        },
      },
    });

    if (pendingExam) {
      throw new Error('Ya tienes un examen de diagnóstico pendiente o en curso. Completa el examen actual antes de solicitar uno nuevo.');
    }
  }

  /**
   * RB-038.2: Validate that student can request English course
   * 
   * Business Rule:
   * - El estudiante debe tener nivelInglesActual definido (haber hecho examen diagnóstico)
   * - No puede inscribirse a un nivel ya completado
   * - El nivel del curso debe ser apropiado según su nivel actual
   * 
   * @param studentId - ID of the student
   * @param courseLevel - Level of the course (1-6)
   * @throws Error if validation fails
   */
  static async validateCanRequestEnglishCourse(studentId: string, courseLevel: number): Promise<void> {
    // Get student info
    const student = await EntityValidators.validateStudentExists(studentId);

    // Check if student has taken diagnostic exam
    if (!student.nivelInglesActual) {
      throw new Error('Debes realizar el examen de diagnóstico antes de inscribirte a un curso de inglés.');
    }

    // Check if student already completed this level
    const completedLevel = await prisma.enrollments.findFirst({
      where: {
        studentId,
        nivelIngles: courseLevel,
        esExamenDiagnostico: false,
        deletedAt: null,
        estatus: 'APROBADO',
      },
    });

    if (completedLevel) {
      throw new Error(`Ya has completado el nivel ${courseLevel} de inglés. No puedes inscribirte nuevamente.`);
    }

    // Validate course level is appropriate
    // Student can enroll in their current level or next level
    if (courseLevel < student.nivelInglesActual) {
      throw new Error(`No puedes inscribirte a un nivel inferior (${courseLevel}) a tu nivel actual (${student.nivelInglesActual}).`);
    }

    // Check if student has pending payment for this level
    const pendingPayment = await prisma.enrollments.findFirst({
      where: {
        studentId,
        nivelIngles: courseLevel,
        esExamenDiagnostico: false,
        deletedAt: null,
        estatus: {
          in: ['PENDIENTE_PAGO', 'PAGO_PENDIENTE_APROBACION'],
        },
      },
    });

    if (pendingPayment) {
      throw new Error(`Ya tienes una solicitud pendiente de pago para el nivel ${courseLevel}.`);
    }
  }

  /**
   * RB-038.3: Validate that group is for English
   * 
   * Business Rule: El grupo debe ser de una materia de inglés
   * 
   * @param groupId - ID of the group
   * @throws Error if group is not for English
   */
  static async validateGroupIsEnglish(groupId: string): Promise<void> {
    const group = await prisma.groups.findUnique({
      where: { id: groupId },
      include: {
        subjects: {
          select: {
            id: true,
            clave: true,
            nombre: true,
          },
        },
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    if (!group.subjects) {
      throw new Error('Group subject information not found');
    }

    if (!isEnglishSubject(group.subjects.clave, group.subjects.nombre)) {
      throw new Error('Este grupo no es de inglés. Solo puedes usar este flujo para materias de inglés.');
    }
  }

  /**
   * RB-038.4: Validate payment amount
   * 
   * Business Rule: El monto del pago debe ser mayor a 0
   * 
   * @param montoPago - Payment amount
   * @throws Error if amount is invalid
   */
  static validatePaymentAmount(montoPago: number): void {
    if (montoPago <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }
  }

  /**
   * RB-038.5: Validate that student meets 70% requirement
   * 
   * Business Rule: El estudiante debe tener al menos 70% en inglés para graduarse
   * 
   * @param studentId - ID of the student
   * @returns true if student meets requirement, false otherwise
   */
  static async validateMeetsEnglishRequirement(studentId: string): Promise<boolean> {
    const student = await EntityValidators.validateStudentExists(studentId);

    if (!student.promedioIngles) {
      return false;
    }

    const porcentaje = Number(student.promedioIngles);
    return porcentaje >= 70;
  }

  /**
   * RB-038.6: Update student English level after diagnostic exam
   * 
   * Business Rule: Actualiza el nivelInglesActual del estudiante según el resultado del examen
   * 
   * @param studentId - ID of the student
   * @param examGrade - Grade from diagnostic exam (0-100)
   */
  static async updateStudentEnglishLevel(studentId: string, examGrade: number): Promise<void> {
    // Determine level based on grade
    // Level 1: 0-40
    // Level 2: 41-55
    // Level 3: 56-70
    // Level 4: 71-80
    // Level 5: 81-90
    // Level 6: 91-100
    let nivel = 1;
    if (examGrade >= 91) nivel = 6;
    else if (examGrade >= 81) nivel = 5;
    else if (examGrade >= 71) nivel = 4;
    else if (examGrade >= 56) nivel = 3;
    else if (examGrade >= 41) nivel = 2;

    // Update student
    await prisma.students.update({
      where: { id: studentId },
      data: {
        nivelInglesActual: nivel,
        fechaExamenDiagnostico: new Date(),
        porcentajeIngles: examGrade,
        cumpleRequisitoIngles: examGrade >= 70,
      },
    });
  }

  /**
   * RB-038.7: Update student English certification after course completion
   * 
   * Business Rule: Actualiza nivelInglesCertificado cuando el estudiante completa un nivel
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


// Exams Validators - Business rules for exams
// V2: Validadores específicos para exámenes
import prisma from '../../../config/database';
import { EntityValidators } from '../../../shared/validators/entity.validators';
import { StudentCalculators } from '../../students/students.validators';

/**
 * ExamsValidators
 * 
 * Contains all business rule validations specific to exams.
 */
export class ExamsValidators {
  /**
   * Validate that student can request exam
   * 
   * @param studentId - ID of the student
   * @param examType - Type of exam
   * @throws Error if student cannot request exam
   */
  static async validateCanRequestExam(
    studentId: string,
    examType: 'DIAGNOSTICO' | 'ADMISION' | 'CERTIFICACION'
  ): Promise<void> {
    // For diagnostic exams, check if student has already completed all English requirements
    if (examType === 'DIAGNOSTICO') {
      const englishRequirementStatus = await StudentCalculators.calculateEnglishRequirementStatus(studentId);
      
      if (englishRequirementStatus.cumpleRequisitoIngles) {
        throw new Error(
          'Ya has cumplido con todos los requisitos de inglés. Has completado todos los niveles (1-6) con un promedio aprobatorio. No es necesario realizar más exámenes de diagnóstico.'
        );
      }
      const activeExam = await (prisma as any).academic_activities.findFirst({
        where: {
          studentId,
          activityType: 'EXAM',
          deletedAt: null,
          estatus: {
            notIn: ['REPROBADO', 'CANCELADO', 'BAJA'],
          },
          exams: {
            examType: 'DIAGNOSTICO',
          },
        },
      });

      if (activeExam) {
        const statusMessages: Record<string, string> = {
          'INSCRITO': 'Ya estás inscrito',
          'EN_CURSO': 'Ya estás presentando',
          'PENDIENTE_PAGO': 'Ya tienes una solicitud pendiente de pago',
          'PAGO_PENDIENTE_APROBACION': 'Ya tienes una solicitud de pago pendiente de aprobación',
          'APROBADO': 'Ya completaste',
        };
        const statusMessage = statusMessages[activeExam.estatus] || 'Ya tienes una solicitud activa';
        throw new Error(`${statusMessage} un examen de diagnóstico. No puedes inscribirte nuevamente.`);
      }
    }
  }

  /**
   * Update student English level after diagnostic exam
   * Creates special course records for intermediate levels if student placed in level > 1
   * 
   * @param studentId - ID of the student
   * @param examGrade - Grade from diagnostic exam (0-100)
   */
  static async updateStudentEnglishLevel(
    studentId: string, 
    examGrade: number, 
    nivelIngles?: number,
    calificacionesPorNivel?: Record<number, number>
  ): Promise<void> {
    // Determine level: use provided nivelIngles or calculate from grade
    let nivel: number;
    
    if (nivelIngles !== undefined && nivelIngles !== null) {
      // Use provided level
      nivel = nivelIngles;
    } else {
      // Calculate level based on grade
      // Level 1: 0-40
      // Level 2: 41-55
      // Level 3: 56-70
      // Level 4: 71-80
      // Level 5: 81-90
      // Level 6: 91-100
      nivel = 1;
      if (examGrade >= 91) nivel = 6;
      else if (examGrade >= 81) nivel = 5;
      else if (examGrade >= 71) nivel = 4;
      else if (examGrade >= 56) nivel = 3;
      else if (examGrade >= 41) nivel = 2;
    }

    // Calculate promedioIngles from all English courses (V2 special_courses)
    const englishCourses = await (prisma as any).academic_activities.findMany({
      where: {
        studentId,
        activityType: 'SPECIAL_COURSE',
        deletedAt: null,
        special_courses: {
          courseType: 'INGLES',
          calificacion: { not: null },
        },
      },
      include: {
        special_courses: {
          select: {
            calificacion: true,
          },
        },
      },
    });

    let promedioIngles: number | null = null;
    if (englishCourses.length > 0) {
      const grades = englishCourses
        .map((activity: any) => activity.special_courses?.calificacion)
        .filter((grade: any) => grade !== null && grade !== undefined)
        .map((grade: any) => Number(grade));
      
      if (grades.length > 0) {
        const sum = grades.reduce((acc: number, grade: number) => acc + grade, 0);
        promedioIngles = Math.round((sum / grades.length) * 100) / 100;
      }
    }

    // Special case: If student got 100%, set nivelInglesActual to 6 and mark requirement as met
    const isPerfectScore = examGrade === 100;
    const finalNivel = isPerfectScore ? 6 : nivel;
    
    // Calculate English requirement status (will be updated by recalculateStudentAverages)
    // For now, set a temporary value - it will be recalculated properly
    await prisma.students.update({
      where: { id: studentId },
      data: {
        nivelInglesActual: finalNivel,
        fechaExamenDiagnostico: new Date(),
        porcentajeIngles: examGrade,
        // If perfect score, mark requirement as met immediately
        // Otherwise, cumpleRequisitoIngles will be recalculated by recalculateStudentAverages
        // which considers both average AND completed levels
        promedioIngles: promedioIngles,
        cumpleRequisitoIngles: isPerfectScore ? true : undefined,
      },
    });

    // Special case: If student got 100%, complete ALL levels (1-6)
    
    // If student placed in level > 1, create special course records for intermediate levels
    // These levels are considered completed with the diagnostic exam grade
    // If perfect score (100%), complete all levels 1-6
    if (nivel > 1 || isPerfectScore) {
      const { randomUUID } = await import('crypto');
      const { generateActivityCode } = await import('../academic-activities.service');

      // Determine which levels to create
      // If perfect score, create all levels 1-6, otherwise create 1 through (nivel - 1)
      const levelsToCreate = isPerfectScore 
        ? [1, 2, 3, 4, 5, 6] 
        : Array.from({ length: nivel - 1 }, (_, i) => i + 1);

      // Create records for all levels that need to be completed
      for (const intermediateLevel of levelsToCreate) {
        // Check if student already has a record for this level
        const existingCourse = await (prisma as any).academic_activities.findFirst({
          where: {
            studentId,
            activityType: 'SPECIAL_COURSE',
            deletedAt: null,
            special_courses: {
              courseType: 'INGLES',
              nivelIngles: intermediateLevel,
            },
          },
        });

        // Only create if doesn't exist
        if (!existingCourse) {
          const codigo = await generateActivityCode('SPECIAL_COURSE');
          const activityId = randomUUID();
          const courseId = randomUUID();

          // Get grade for this level: use calificacionesPorNivel if provided, otherwise use examGrade
          const levelGrade = calificacionesPorNivel && calificacionesPorNivel[intermediateLevel] !== undefined
            ? calificacionesPorNivel[intermediateLevel]
            : examGrade;

          await prisma.$transaction(async (tx) => {
            // Create academic activity
            const activity = await (tx as any).academic_activities.create({
              data: {
                id: activityId,
                studentId,
                activityType: 'SPECIAL_COURSE',
                codigo,
                estatus: 'APROBADO', // Marked as approved with diagnostic exam grade
                fechaInscripcion: new Date(),
              },
            });

            // Create special course
            await (tx as any).special_courses.create({
              data: {
                id: courseId,
                activityId: activity.id,
                courseType: 'INGLES',
                nivelIngles: intermediateLevel,
                groupId: null, // No group - completed via diagnostic exam
                requierePago: false,
                pagoAprobado: true,
                fechaPagoAprobado: new Date(),
                calificacion: levelGrade, // Use specific grade for this level or exam grade
                aprobado: true,
                fechaAprobacion: new Date(),
                completadoPorDiagnostico: true, // Mark as completed by diagnostic exam
              },
            });

            // Log to history
            await (tx as any).activity_history.create({
              data: {
                id: randomUUID(),
                activityId: activity.id,
                accion: 'CREATED',
                descripcion: `Nivel ${intermediateLevel} de inglés completado mediante examen de diagnóstico (calificación: ${levelGrade})`,
              },
            });
          });
        }
      }
    }
  }
}


// English enrollments service - Business logic for English enrollments
// RB-038: Servicio específico para inscripciones de inglés
import { randomUUID } from 'crypto';
import prisma from '../../../config/database';
import { EnglishEnrollmentsValidators } from './english-enrollments.validators';
import { recalculateStudentAverages } from '../../students/students.service';
import { mapEnrollmentToResponseDto } from '../enrollments.service';
import type { EnrollmentResponseDto } from '../enrollments.dtos';

/**
 * Request diagnostic exam enrollment
 * RB-038: Examen de diagnóstico es gratis y auto-aprobado
 */
export const requestDiagnosticExam = async (
  studentId: string,
  groupId: string
): Promise<EnrollmentResponseDto> => {
  // Validate student exists and is active
  await EnglishEnrollmentsValidators.validateCanRequestDiagnosticExam(studentId);
  
  // Validate group is for English
  await EnglishEnrollmentsValidators.validateGroupIsEnglish(groupId);

  // Get group info
  const group = await prisma.groups.findUnique({
    where: { id: groupId },
    include: {
      subjects: true,
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Generate enrollment code
  const enrollmentCount = await prisma.enrollments.count();
  const codigo = `EXA-${String(enrollmentCount + 1).padStart(8, '0')}`;

  // Create enrollment for diagnostic exam
  const enrollment = await prisma.enrollments.create({
    data: {
      id: randomUUID(),
      studentId,
      groupId,
      codigo,
      fechaInscripcion: new Date(),
      updatedAt: new Date(),
      tipoInscripcion: 'EXAMEN_DIAGNOSTICO',
      estatus: 'INSCRITO', // Auto-approved, no payment needed
      esExamenDiagnostico: true,
      requierePago: false,
      pagoAprobado: true, // Auto-approved
      fechaPagoAprobado: new Date(),
      nivelIngles: null, // Will be set after exam
    },
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
  });

  // Update group capacity
  await prisma.groups.update({
    where: { id: groupId },
    data: { cupoActual: { increment: 1 } },
  });

  return {
    ...mapEnrollmentToResponseDto(enrollment),
    student: {
      id: enrollment.students.id,
      matricula: enrollment.students.matricula,
      nombre: enrollment.students.nombre,
      apellidoPaterno: enrollment.students.apellidoPaterno,
      apellidoMaterno: enrollment.students.apellidoMaterno,
      carrera: enrollment.students.carrera,
      semestre: enrollment.students.semestre,
      estatus: enrollment.students.estatus,
    },
    group: {
      id: enrollment.groups.id,
      nombre: enrollment.groups.nombre,
      periodo: enrollment.groups.periodo,
      subject: {
        id: enrollment.groups.subjects.id,
        clave: enrollment.groups.subjects.clave,
        nombre: enrollment.groups.subjects.nombre,
        creditos: enrollment.groups.subjects.creditos,
      },
      teacher: {
        id: enrollment.groups.teachers.id,
        nombre: enrollment.groups.teachers.nombre,
        apellidoPaterno: enrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: enrollment.groups.teachers.apellidoMaterno,
        departamento: enrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Request English course enrollment
 * RB-038: Curso de inglés requiere pago y aprobación
 */
export const requestEnglishCourse = async (
  studentId: string,
  groupId: string,
  nivelIngles: number
): Promise<EnrollmentResponseDto> => {
  // Validate student can request this course
  await EnglishEnrollmentsValidators.validateCanRequestEnglishCourse(studentId, nivelIngles);
  
  // Validate group is for English
  await EnglishEnrollmentsValidators.validateGroupIsEnglish(groupId);

  // Get group info
  const group = await prisma.groups.findUnique({
    where: { id: groupId },
    include: {
      subjects: true,
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Generate enrollment code
  const enrollmentCount = await prisma.enrollments.count();
  const codigo = `ING-${String(enrollmentCount + 1).padStart(8, '0')}`;

  // Create enrollment for English course (pending payment)
  const enrollment = await prisma.enrollments.create({
    data: {
      id: randomUUID(),
      studentId,
      groupId,
      codigo,
      fechaInscripcion: new Date(),
      updatedAt: new Date(),
      tipoInscripcion: 'CURSO_INGLES',
      estatus: 'PENDIENTE_PAGO',
      esExamenDiagnostico: false,
      requierePago: true,
      pagoAprobado: null, // Pending approval
      nivelIngles,
    },
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
  });

  // Note: Group capacity is NOT updated until payment is approved

  return {
    ...mapEnrollmentToResponseDto(enrollment),
    student: {
      id: enrollment.students.id,
      matricula: enrollment.students.matricula,
      nombre: enrollment.students.nombre,
      apellidoPaterno: enrollment.students.apellidoPaterno,
      apellidoMaterno: enrollment.students.apellidoMaterno,
      carrera: enrollment.students.carrera,
      semestre: enrollment.students.semestre,
      estatus: enrollment.students.estatus,
    },
    group: {
      id: enrollment.groups.id,
      nombre: enrollment.groups.nombre,
      periodo: enrollment.groups.periodo,
      subject: {
        id: enrollment.groups.subjects.id,
        clave: enrollment.groups.subjects.clave,
        nombre: enrollment.groups.subjects.nombre,
        creditos: enrollment.groups.subjects.creditos,
      },
      teacher: {
        id: enrollment.groups.teachers.id,
        nombre: enrollment.groups.teachers.nombre,
        apellidoPaterno: enrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: enrollment.groups.teachers.apellidoMaterno,
        departamento: enrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Submit payment proof for English course
 * RB-038: Estudiante sube comprobante de pago
 */
export const submitPaymentProof = async (
  enrollmentId: string,
  montoPago: number,
  comprobantePago: string
): Promise<EnrollmentResponseDto> => {
  // Validate enrollment exists and is pending payment
  const enrollment = await prisma.enrollments.findUnique({
    where: { id: enrollmentId },
    include: {
      students: true,
      groups: {
        include: {
          subjects: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (!enrollment.requierePago) {
    throw new Error('Esta inscripción no requiere pago');
  }

  if (enrollment.estatus !== 'PENDIENTE_PAGO') {
    throw new Error('Esta inscripción no está pendiente de pago');
  }

  // Validate payment amount
  EnglishEnrollmentsValidators.validatePaymentAmount(montoPago);

  // Update enrollment with payment info
  const updatedEnrollment = await prisma.enrollments.update({
    where: { id: enrollmentId },
    data: {
      montoPago,
      comprobantePago,
      estatus: 'PAGO_PENDIENTE_APROBACION',
    },
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
  });

  return {
    ...mapEnrollmentToResponseDto(updatedEnrollment),
    student: {
      id: updatedEnrollment.students.id,
      matricula: updatedEnrollment.students.matricula,
      nombre: updatedEnrollment.students.nombre,
      apellidoPaterno: updatedEnrollment.students.apellidoPaterno,
      apellidoMaterno: updatedEnrollment.students.apellidoMaterno,
      carrera: updatedEnrollment.students.carrera,
      semestre: updatedEnrollment.students.semestre,
      estatus: updatedEnrollment.students.estatus,
    },
    group: {
      id: updatedEnrollment.groups.id,
      nombre: updatedEnrollment.groups.nombre,
      periodo: updatedEnrollment.groups.periodo,
      subject: {
        id: updatedEnrollment.groups.subjects.id,
        clave: updatedEnrollment.groups.subjects.clave,
        nombre: updatedEnrollment.groups.subjects.nombre,
        creditos: updatedEnrollment.groups.subjects.creditos,
      },
      teacher: {
        id: updatedEnrollment.groups.teachers.id,
        nombre: updatedEnrollment.groups.teachers.nombre,
        apellidoPaterno: updatedEnrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: updatedEnrollment.groups.teachers.apellidoMaterno,
        departamento: updatedEnrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Approve payment for English course (Admin only)
 * RB-038: Admin aprueba el pago y la inscripción se activa
 */
export const approvePayment = async (
  enrollmentId: string,
  adminUserId: string
): Promise<EnrollmentResponseDto> => {
  // Get enrollment
  const enrollment = await prisma.enrollments.findUnique({
    where: { id: enrollmentId },
    include: {
      students: true,
      groups: {
        include: {
          subjects: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.estatus !== 'PAGO_PENDIENTE_APROBACION') {
    throw new Error('Esta inscripción no está pendiente de aprobación de pago');
  }

  // Update enrollment - approve payment
  const updatedEnrollment = await prisma.enrollments.update({
    where: { id: enrollmentId },
    data: {
      pagoAprobado: true,
      fechaPagoAprobado: new Date(),
      estatus: 'PAGO_APROBADO',
      updatedBy: adminUserId,
    },
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
  });

  // Update group capacity (now that payment is approved)
  await prisma.groups.update({
    where: { id: enrollment.groupId },
    data: { cupoActual: { increment: 1 } },
  });

  return {
    ...mapEnrollmentToResponseDto(updatedEnrollment),
    student: {
      id: updatedEnrollment.students.id,
      matricula: updatedEnrollment.students.matricula,
      nombre: updatedEnrollment.students.nombre,
      apellidoPaterno: updatedEnrollment.students.apellidoPaterno,
      apellidoMaterno: updatedEnrollment.students.apellidoMaterno,
      carrera: updatedEnrollment.students.carrera,
      semestre: updatedEnrollment.students.semestre,
      estatus: updatedEnrollment.students.estatus,
    },
    group: {
      id: updatedEnrollment.groups.id,
      nombre: updatedEnrollment.groups.nombre,
      periodo: updatedEnrollment.groups.periodo,
      subject: {
        id: updatedEnrollment.groups.subjects.id,
        clave: updatedEnrollment.groups.subjects.clave,
        nombre: updatedEnrollment.groups.subjects.nombre,
        creditos: updatedEnrollment.groups.subjects.creditos,
      },
      teacher: {
        id: updatedEnrollment.groups.teachers.id,
        nombre: updatedEnrollment.groups.teachers.nombre,
        apellidoPaterno: updatedEnrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: updatedEnrollment.groups.teachers.apellidoMaterno,
        departamento: updatedEnrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Reject payment for English course (Admin only)
 */
export const rejectPayment = async (
  enrollmentId: string,
  adminUserId: string,
  motivo: string
): Promise<EnrollmentResponseDto> => {
  // Get enrollment
  const enrollment = await prisma.enrollments.findUnique({
    where: { id: enrollmentId },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.estatus !== 'PAGO_PENDIENTE_APROBACION') {
    throw new Error('Esta inscripción no está pendiente de aprobación de pago');
  }

  // Update enrollment - reject payment
  const updatedEnrollment = await prisma.enrollments.update({
    where: { id: enrollmentId },
    data: {
      pagoAprobado: false,
      estatus: 'CANCELADO',
      observaciones: motivo || 'Pago rechazado por administrador',
      updatedBy: adminUserId,
    },
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
  });

  return {
    ...mapEnrollmentToResponseDto(updatedEnrollment),
    student: {
      id: updatedEnrollment.students.id,
      matricula: updatedEnrollment.students.matricula,
      nombre: updatedEnrollment.students.nombre,
      apellidoPaterno: updatedEnrollment.students.apellidoPaterno,
      apellidoMaterno: updatedEnrollment.students.apellidoMaterno,
      carrera: updatedEnrollment.students.carrera,
      semestre: updatedEnrollment.students.semestre,
      estatus: updatedEnrollment.students.estatus,
    },
    group: {
      id: updatedEnrollment.groups.id,
      nombre: updatedEnrollment.groups.nombre,
      periodo: updatedEnrollment.groups.periodo,
      subject: {
        id: updatedEnrollment.groups.subjects.id,
        clave: updatedEnrollment.groups.subjects.clave,
        nombre: updatedEnrollment.groups.subjects.nombre,
        creditos: updatedEnrollment.groups.subjects.creditos,
      },
      teacher: {
        id: updatedEnrollment.groups.teachers.id,
        nombre: updatedEnrollment.groups.teachers.nombre,
        apellidoPaterno: updatedEnrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: updatedEnrollment.groups.teachers.apellidoMaterno,
        departamento: updatedEnrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Process diagnostic exam result
 * RB-038: Actualiza nivelInglesActual del estudiante según resultado
 */
export const processDiagnosticExamResult = async (
  enrollmentId: string,
  examGrade: number
): Promise<EnrollmentResponseDto> => {
  // Get enrollment
  const enrollment = await prisma.enrollments.findUnique({
    where: { id: enrollmentId },
    include: {
      students: true,
      groups: {
        include: {
          subjects: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (!enrollment.esExamenDiagnostico) {
    throw new Error('Esta inscripción no es un examen de diagnóstico');
  }

  // Validate grade
  if (examGrade < 0 || examGrade > 100) {
    throw new Error('La calificación debe estar entre 0 y 100');
  }

  // Update enrollment with grade
  const updatedEnrollment = await prisma.enrollments.update({
    where: { id: enrollmentId },
    data: {
      calificacionFinal: examGrade,
      calificacion: examGrade,
      estatus: examGrade >= 70 ? 'APROBADO' : 'REPROBADO',
      aprobado: examGrade >= 70,
      fechaAprobacion: examGrade >= 70 ? new Date() : null,
    },
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
  });

  // Update student English level
  await EnglishEnrollmentsValidators.updateStudentEnglishLevel(
    enrollment.studentId,
    examGrade
  );

  // Recalculate student averages
  await recalculateStudentAverages(enrollment.studentId).catch((error: unknown) => {
    console.error('Error recalculating student averages:', error);
  });

  return {
    ...mapEnrollmentToResponseDto(updatedEnrollment),
    student: {
      id: updatedEnrollment.students.id,
      matricula: updatedEnrollment.students.matricula,
      nombre: updatedEnrollment.students.nombre,
      apellidoPaterno: updatedEnrollment.students.apellidoPaterno,
      apellidoMaterno: updatedEnrollment.students.apellidoMaterno,
      carrera: updatedEnrollment.students.carrera,
      semestre: updatedEnrollment.students.semestre,
      estatus: updatedEnrollment.students.estatus,
    },
    group: {
      id: updatedEnrollment.groups.id,
      nombre: updatedEnrollment.groups.nombre,
      periodo: updatedEnrollment.groups.periodo,
      subject: {
        id: updatedEnrollment.groups.subjects.id,
        clave: updatedEnrollment.groups.subjects.clave,
        nombre: updatedEnrollment.groups.subjects.nombre,
        creditos: updatedEnrollment.groups.subjects.creditos,
      },
      teacher: {
        id: updatedEnrollment.groups.teachers.id,
        nombre: updatedEnrollment.groups.teachers.nombre,
        apellidoPaterno: updatedEnrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: updatedEnrollment.groups.teachers.apellidoMaterno,
        departamento: updatedEnrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Process English course completion
 * RB-038: Actualiza nivelInglesCertificado cuando completa un nivel
 */
export const processEnglishCourseCompletion = async (
  enrollmentId: string,
  finalGrade: number
): Promise<EnrollmentResponseDto> => {
  // Get enrollment
  const enrollment = await prisma.enrollments.findUnique({
    where: { id: enrollmentId },
    include: {
      students: true,
      groups: {
        include: {
          subjects: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.esExamenDiagnostico) {
    throw new Error('Esta inscripción es un examen de diagnóstico, no un curso');
  }

  if (!enrollment.nivelIngles) {
    throw new Error('Esta inscripción no tiene nivel de inglés definido');
  }

  // Validate grade
  if (finalGrade < 0 || finalGrade > 100) {
    throw new Error('La calificación debe estar entre 0 y 100');
  }

  // Update enrollment with grade
  const updatedEnrollment = await prisma.enrollments.update({
    where: { id: enrollmentId },
    data: {
      calificacionFinal: finalGrade,
      calificacion: finalGrade,
      estatus: finalGrade >= 70 ? 'APROBADO' : 'REPROBADO',
      aprobado: finalGrade >= 70,
      fechaAprobacion: finalGrade >= 70 ? new Date() : null,
    },
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
  });

  // Update student English certification if approved
  if (finalGrade >= 70) {
    await EnglishEnrollmentsValidators.updateStudentEnglishCertification(
      enrollment.studentId,
      enrollment.nivelIngles,
      finalGrade
    );
  }

  // Recalculate student averages
  await recalculateStudentAverages(enrollment.studentId).catch((error: unknown) => {
    console.error('Error recalculating student averages:', error);
  });

  return {
    ...mapEnrollmentToResponseDto(updatedEnrollment),
    student: {
      id: updatedEnrollment.students.id,
      matricula: updatedEnrollment.students.matricula,
      nombre: updatedEnrollment.students.nombre,
      apellidoPaterno: updatedEnrollment.students.apellidoPaterno,
      apellidoMaterno: updatedEnrollment.students.apellidoMaterno,
      carrera: updatedEnrollment.students.carrera,
      semestre: updatedEnrollment.students.semestre,
      estatus: updatedEnrollment.students.estatus,
    },
    group: {
      id: updatedEnrollment.groups.id,
      nombre: updatedEnrollment.groups.nombre,
      periodo: updatedEnrollment.groups.periodo,
      subject: {
        id: updatedEnrollment.groups.subjects.id,
        clave: updatedEnrollment.groups.subjects.clave,
        nombre: updatedEnrollment.groups.subjects.nombre,
        creditos: updatedEnrollment.groups.subjects.creditos,
      },
      teacher: {
        id: updatedEnrollment.groups.teachers.id,
        nombre: updatedEnrollment.groups.teachers.nombre,
        apellidoPaterno: updatedEnrollment.groups.teachers.apellidoPaterno,
        apellidoMaterno: updatedEnrollment.groups.teachers.apellidoMaterno,
        departamento: updatedEnrollment.groups.teachers.departamento,
      },
    },
  };
};

/**
 * Get student English status
 * RB-038: Obtiene el estado completo de inglés del estudiante
 */
export const getStudentEnglishStatus = async (studentId: string) => {
  const student = await prisma.students.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        where: {
          deletedAt: null,
          OR: [
            { esExamenDiagnostico: true },
            { tipoInscripcion: 'CURSO_INGLES' },
          ],
        },
        include: {
          groups: {
            include: {
              subjects: true,
            },
          },
        },
        orderBy: {
          fechaInscripcion: 'desc',
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Separate exam and courses
  const diagnosticExams = student.enrollments.filter(e => e.esExamenDiagnostico);
  const englishCourses = student.enrollments.filter(e => !e.esExamenDiagnostico);

  // Get completed levels
  const completedLevels = englishCourses
    .filter(e => e.estatus === 'APROBADO' && e.nivelIngles !== null)
    .map(e => e.nivelIngles!)
    .sort((a, b) => a - b);

  // Determine missing levels (1-6)
  const allLevels = [1, 2, 3, 4, 5, 6];
  const missingLevels = allLevels.filter(level => !completedLevels.includes(level));

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
    porcentajeIngles: student.promedioIngles ? Number(student.promedioIngles) : null,
    cumpleRequisitoIngles: student.cumpleRequisitoIngles,
    fechaExamenDiagnostico: student.fechaExamenDiagnostico,
    diagnosticExams: diagnosticExams.map(e => ({
      id: e.id,
      fechaInscripcion: e.fechaInscripcion,
      estatus: e.estatus,
      calificacion: e.calificacionFinal || e.calificacion,
      subject: e.groups.subjects.nombre,
    })),
    englishCourses: englishCourses.map(e => ({
      id: e.id,
      nivelIngles: e.nivelIngles,
      fechaInscripcion: e.fechaInscripcion,
      estatus: e.estatus,
      pagoAprobado: e.pagoAprobado,
      calificacion: e.calificacionFinal || e.calificacion,
      subject: e.groups.subjects.nombre,
    })),
    completedLevels,
    missingLevels,
    progress: {
      totalLevels: 6,
      completed: completedLevels.length,
      percentage: (completedLevels.length / 6) * 100,
    },
  };
};

/**
 * Get pending payment approvals (Admin only)
 */
export const getPendingPaymentApprovals = async () => {
  const enrollments = await prisma.enrollments.findMany({
    where: {
      estatus: 'PAGO_PENDIENTE_APROBACION',
      deletedAt: null,
    },
    include: {
      students: {
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          carrera: true,
        },
      },
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
    orderBy: {
      fechaInscripcion: 'desc',
    },
  });

  return {
    enrollments: enrollments.map(e => ({
      id: e.id,
      codigo: e.codigo,
      fechaInscripcion: e.fechaInscripcion,
      nivelIngles: e.nivelIngles,
      montoPago: e.montoPago ? Number(e.montoPago) : null,
      comprobantePago: e.comprobantePago,
      student: {
        id: e.students.id,
        matricula: e.students.matricula,
        nombre: `${e.students.nombre} ${e.students.apellidoPaterno} ${e.students.apellidoMaterno}`,
        carrera: e.students.carrera,
      },
      subject: {
        id: e.groups.subjects.id,
        clave: e.groups.subjects.clave,
        nombre: e.groups.subjects.nombre,
      },
    })),
    total: enrollments.length,
  };
};


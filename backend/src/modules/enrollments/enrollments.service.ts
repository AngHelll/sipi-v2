// Enrollments service - Business logic for enrollment management
import prisma from '../../config/database';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  EnrollmentResponseDto,
  EnrollmentsListResponseDto,
} from './enrollments.dtos';

/**
 * Get enrollments for the current student (GET /api/enrollments/me)
 * Returns all enrollments for the authenticated student with full group and subject information
 */
export const getEnrollmentsMe = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<EnrollmentsListResponseDto> => {
  // Find student record for this user
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    // Student not found, return empty result
    return {
      enrollments: [],
      pagination: {
        page,
        limit: Math.min(limit, 100),
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Get total count
  const total = await prisma.enrollment.count({
    where: { studentId: student.id },
  });

  // Get enrollments with related data
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    skip,
    take,
    orderBy: { id: 'desc' }, // Order by id since createdAt doesn't exist
    include: {
      student: {
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
      group: {
        include: {
          subject: {
            select: {
              id: true,
              clave: true,
              nombre: true,
              creditos: true,
            },
          },
          teacher: {
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
    enrollments: enrollments.map((enrollment) => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      groupId: enrollment.groupId,
      calificacion: enrollment.calificacion ? enrollment.calificacion.toNumber() : null,
      student: {
        id: enrollment.student.id,
        matricula: enrollment.student.matricula,
        nombre: enrollment.student.nombre,
        apellidoPaterno: enrollment.student.apellidoPaterno,
        apellidoMaterno: enrollment.student.apellidoMaterno,
        carrera: enrollment.student.carrera,
        semestre: enrollment.student.semestre,
        estatus: enrollment.student.estatus,
      },
      group: {
        id: enrollment.group.id,
        nombre: enrollment.group.nombre,
        periodo: enrollment.group.periodo,
        subject: {
          id: enrollment.group.subject.id,
          clave: enrollment.group.subject.clave,
          nombre: enrollment.group.subject.nombre,
          creditos: enrollment.group.subject.creditos,
        },
        teacher: {
          id: enrollment.group.teacher.id,
          nombre: enrollment.group.teacher.nombre,
          apellidoPaterno: enrollment.group.teacher.apellidoPaterno,
          apellidoMaterno: enrollment.group.teacher.apellidoMaterno,
          departamento: enrollment.group.teacher.departamento,
        },
      },
    })),
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Get enrollments for a specific group
 * TEACHER can only see enrollments for their own groups
 * ADMIN can see enrollments for any group
 */
export const getEnrollmentsByGroup = async (
  groupId: string,
  userId?: string,
  userRole?: string
): Promise<EnrollmentsListResponseDto> => {
  // Check if group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      teacher: true,
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // If user is TEACHER, verify they own this group
  if (userRole === 'TEACHER' && userId) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher || group.teacherId !== teacher.id) {
      throw new Error('You can only view enrollments for your own groups');
    }
  }

  // Get enrollments for this group
  const enrollments = await prisma.enrollment.findMany({
    where: { groupId },
    orderBy: { id: 'asc' },
    include: {
      student: {
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
      group: {
        include: {
          subject: {
            select: {
              id: true,
              clave: true,
              nombre: true,
              creditos: true,
            },
          },
          teacher: {
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
    enrollments: enrollments.map((enrollment) => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      groupId: enrollment.groupId,
      calificacion: enrollment.calificacion ? enrollment.calificacion.toNumber() : null,
      student: {
        id: enrollment.student.id,
        matricula: enrollment.student.matricula,
        nombre: enrollment.student.nombre,
        apellidoPaterno: enrollment.student.apellidoPaterno,
        apellidoMaterno: enrollment.student.apellidoMaterno,
        carrera: enrollment.student.carrera,
        semestre: enrollment.student.semestre,
        estatus: enrollment.student.estatus,
      },
      group: {
        id: enrollment.group.id,
        nombre: enrollment.group.nombre,
        periodo: enrollment.group.periodo,
        subject: {
          id: enrollment.group.subject.id,
          clave: enrollment.group.subject.clave,
          nombre: enrollment.group.subject.nombre,
          creditos: enrollment.group.subject.creditos,
        },
        teacher: {
          id: enrollment.group.teacher.id,
          nombre: enrollment.group.teacher.nombre,
          apellidoPaterno: enrollment.group.teacher.apellidoPaterno,
          apellidoMaterno: enrollment.group.teacher.apellidoMaterno,
          departamento: enrollment.group.teacher.departamento,
        },
      },
    })),
    pagination: {
      page: 1,
      limit: enrollments.length,
      total: enrollments.length,
      totalPages: 1,
    },
  };
};

/**
 * Create a new enrollment
 * Only ADMIN can create enrollments
 * Validates that studentId and groupId exist
 * Prevents duplicate enrollments (student already enrolled in group)
 */
export const createEnrollment = async (
  data: CreateEnrollmentDto
): Promise<EnrollmentResponseDto> => {
  const { studentId, groupId, calificacion } = data;

  // Validate that student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Validate that group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Check if enrollment already exists (unique constraint: studentId + groupId)
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_groupId: {
        studentId,
        groupId,
      },
    },
  });

  if (existingEnrollment) {
    throw new Error('Student is already enrolled in this group');
  }

  // Validate calificacion if provided (should be between 0 and 100)
  if (calificacion !== undefined && calificacion !== null) {
    if (calificacion < 0 || calificacion > 100) {
      throw new Error('Calificacion must be between 0 and 100');
    }
  }

  // Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      groupId,
      calificacion: calificacion ?? null,
    },
    include: {
      student: {
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
      group: {
        include: {
          subject: {
            select: {
              id: true,
              clave: true,
              nombre: true,
              creditos: true,
            },
          },
          teacher: {
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
    id: enrollment.id,
    studentId: enrollment.studentId,
    groupId: enrollment.groupId,
    calificacion: enrollment.calificacion ? enrollment.calificacion.toNumber() : null,
    student: {
      id: enrollment.student.id,
      matricula: enrollment.student.matricula,
      nombre: enrollment.student.nombre,
      apellidoPaterno: enrollment.student.apellidoPaterno,
      apellidoMaterno: enrollment.student.apellidoMaterno,
      carrera: enrollment.student.carrera,
      semestre: enrollment.student.semestre,
      estatus: enrollment.student.estatus,
    },
    group: {
      id: enrollment.group.id,
      nombre: enrollment.group.nombre,
      periodo: enrollment.group.periodo,
      subject: {
        id: enrollment.group.subject.id,
        clave: enrollment.group.subject.clave,
        nombre: enrollment.group.subject.nombre,
        creditos: enrollment.group.subject.creditos,
      },
      teacher: {
        id: enrollment.group.teacher.id,
        nombre: enrollment.group.teacher.nombre,
        apellidoPaterno: enrollment.group.teacher.apellidoPaterno,
        apellidoMaterno: enrollment.group.teacher.apellidoMaterno,
        departamento: enrollment.group.teacher.departamento,
      },
    },
  };
};

/**
 * Update an existing enrollment
 * TEACHER can only update calificacion (and only for groups they teach)
 * ADMIN can update all fields
 */
export const updateEnrollment = async (
  id: string,
  data: UpdateEnrollmentDto,
  userId?: string,
  userRole?: string
): Promise<EnrollmentResponseDto> => {
  // Check if enrollment exists
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          teacher: true,
        },
      },
    },
  });

  if (!existingEnrollment) {
    throw new Error('Enrollment not found');
  }

  // If user is TEACHER, they can only update calificacion
  // and only for groups they teach
  if (userRole === 'TEACHER' && userId) {
    // Find teacher record for this user
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Check if this enrollment belongs to a group taught by this teacher
    if (existingEnrollment.group.teacherId !== teacher.id) {
      throw new Error('You can only update grades for your own groups');
    }

    // TEACHER can only update calificacion
    if (data.studentId !== undefined || data.groupId !== undefined) {
      throw new Error('Teachers can only update calificacion');
    }

    // Validate calificacion if provided
    if (data.calificacion !== undefined && data.calificacion !== null) {
      if (data.calificacion < 0 || data.calificacion > 100) {
        throw new Error('Calificacion must be between 0 and 100');
      }
    }
  }

  // ADMIN can update all fields
  if (userRole === 'ADMIN') {
    // Validate studentId if provided
    if (data.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        throw new Error('Student not found');
      }
    }

    // Validate groupId if provided
    if (data.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: data.groupId },
      });

      if (!group) {
        throw new Error('Group not found');
      }

      // Check for duplicate enrollment if groupId is being changed
      if (data.groupId !== existingEnrollment.groupId) {
        const duplicate = await prisma.enrollment.findUnique({
          where: {
            studentId_groupId: {
              studentId: data.studentId || existingEnrollment.studentId,
              groupId: data.groupId,
            },
          },
        });

        if (duplicate) {
          throw new Error('Student is already enrolled in this group');
        }
      }
    }

    // Validate calificacion if provided
    if (data.calificacion !== undefined && data.calificacion !== null) {
      if (data.calificacion < 0 || data.calificacion > 100) {
        throw new Error('Calificacion must be between 0 and 100');
      }
    }
  }

  // Update enrollment
  const enrollment = await prisma.enrollment.update({
    where: { id },
    data: {
      calificacion: data.calificacion,
      studentId: data.studentId,
      groupId: data.groupId,
    },
    include: {
      student: {
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
      group: {
        include: {
          subject: {
            select: {
              id: true,
              clave: true,
              nombre: true,
              creditos: true,
            },
          },
          teacher: {
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
    id: enrollment.id,
    studentId: enrollment.studentId,
    groupId: enrollment.groupId,
    calificacion: enrollment.calificacion ? enrollment.calificacion.toNumber() : null,
    student: {
      id: enrollment.student.id,
      matricula: enrollment.student.matricula,
      nombre: enrollment.student.nombre,
      apellidoPaterno: enrollment.student.apellidoPaterno,
      apellidoMaterno: enrollment.student.apellidoMaterno,
      carrera: enrollment.student.carrera,
      semestre: enrollment.student.semestre,
      estatus: enrollment.student.estatus,
    },
    group: {
      id: enrollment.group.id,
      nombre: enrollment.group.nombre,
      periodo: enrollment.group.periodo,
      subject: {
        id: enrollment.group.subject.id,
        clave: enrollment.group.subject.clave,
        nombre: enrollment.group.subject.nombre,
        creditos: enrollment.group.subject.creditos,
      },
      teacher: {
        id: enrollment.group.teacher.id,
        nombre: enrollment.group.teacher.nombre,
        apellidoPaterno: enrollment.group.teacher.apellidoPaterno,
        apellidoMaterno: enrollment.group.teacher.apellidoMaterno,
        departamento: enrollment.group.teacher.departamento,
      },
    },
  };
};

/**
 * Delete an enrollment
 * ADMIN only
 */
export const deleteEnrollment = async (id: string): Promise<void> => {
  // Check if enrollment exists
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Delete enrollment
  await prisma.enrollment.delete({
    where: { id },
  });
};


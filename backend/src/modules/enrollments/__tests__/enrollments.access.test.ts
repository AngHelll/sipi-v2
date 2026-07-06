// RBAC en GET /api/enrollments/:id — 403 en lugar de 500 cuando no hay permiso.

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    enrollments: { findUnique: jest.fn() },
    academic_activities: { findUnique: jest.fn() },
    students: { findUnique: jest.fn() },
    teachers: { findUnique: jest.fn() },
  },
}));

import prisma from '../../../config/database';
import { ForbiddenError } from '../../../middleware/errorHandler';
import { getEnrollmentById } from '../enrollments.service';

const prismaMock = prisma as unknown as {
  enrollments: { findUnique: jest.Mock };
  academic_activities: { findUnique: jest.Mock };
  students: { findUnique: jest.Mock };
  teachers: { findUnique: jest.Mock };
};

const ENROLLMENT_ID = '11111111-1111-1111-1111-111111111111';
const STUDENT_OWNER_ID = 'student-owner';
const TEACHER_OWNER_ID = 'teacher-owner';

const legacyEnrollment = {
  id: ENROLLMENT_ID,
  studentId: STUDENT_OWNER_ID,
  groupId: 'group-1',
  calificacion: null,
  groups: {
    id: 'group-1',
    teacherId: TEACHER_OWNER_ID,
    nombre: 'Grupo A',
    periodo: '2026-1',
    subjects: { id: 'sub-1', clave: 'MAT-1', nombre: 'Materia', creditos: 5 },
    teachers: {
      id: TEACHER_OWNER_ID,
      nombre: 'Ana',
      apellidoPaterno: 'López',
      apellidoMaterno: 'García',
      departamento: 'Idiomas',
    },
  },
  students: {
    id: STUDENT_OWNER_ID,
    matricula: 'A001',
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'Ruiz',
    carrera: 'ISC',
    semestre: 3,
    estatus: 'ACTIVO',
  },
};

describe('getEnrollmentById — control de acceso (legacy)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.enrollments.findUnique.mockResolvedValue(legacyEnrollment);
    prismaMock.academic_activities.findUnique.mockResolvedValue(null);
  });

  it('ADMIN puede leer cualquier inscripción', async () => {
    const result = await getEnrollmentById(ENROLLMENT_ID, 'admin-user', 'ADMIN');
    expect(result).not.toBeNull();
    expect(result?.id).toBe(ENROLLMENT_ID);
  });

  it('STUDENT ajeno lanza ForbiddenError', async () => {
    prismaMock.students.findUnique.mockResolvedValue({ id: 'other-student' });
    await expect(getEnrollmentById(ENROLLMENT_ID, 'student-user', 'STUDENT')).rejects.toThrow(
      ForbiddenError
    );
  });

  it('STUDENT propietario puede leer su inscripción', async () => {
    prismaMock.students.findUnique.mockResolvedValue({ id: STUDENT_OWNER_ID });
    const result = await getEnrollmentById(ENROLLMENT_ID, 'student-user', 'STUDENT');
    expect(result?.studentId).toBe(STUDENT_OWNER_ID);
  });

  it('TEACHER ajeno lanza ForbiddenError', async () => {
    prismaMock.teachers.findUnique.mockResolvedValue({ id: 'other-teacher' });
    await expect(getEnrollmentById(ENROLLMENT_ID, 'teacher-user', 'TEACHER')).rejects.toThrow(
      ForbiddenError
    );
  });

  it('TEACHER del grupo puede leer la inscripción', async () => {
    prismaMock.teachers.findUnique.mockResolvedValue({ id: TEACHER_OWNER_ID });
    const result = await getEnrollmentById(ENROLLMENT_ID, 'teacher-user', 'TEACHER');
    expect(result?.groupId).toBe('group-1');
  });
});

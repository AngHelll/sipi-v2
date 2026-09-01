// RBAC en GET /api/groups/:id — cierra IDOR y oculta costo a TEACHER.

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    groups: { findUnique: jest.fn() },
    teachers: { findUnique: jest.fn() },
    students: { findUnique: jest.fn() },
    enrollments: { findFirst: jest.fn() },
    academic_activities: { findFirst: jest.fn() },
  },
}));

import { Prisma } from '@/db/client';
import prisma from '../../../config/database';
import { getGroupById } from '../groups.service';

const prismaMock = prisma as unknown as {
  groups: { findUnique: jest.Mock };
  teachers: { findUnique: jest.Mock };
  students: { findUnique: jest.Mock };
  enrollments: { findFirst: jest.Mock };
  academic_activities: { findFirst: jest.Mock };
};

const GROUP_ID = '11111111-1111-1111-1111-111111111111';
const TEACHER_USER_ID = '22222222-2222-2222-2222-222222222222';
const OTHER_TEACHER_USER_ID = '33333333-3333-3333-3333-333333333333';
const TEACHER_ID = '44444444-4444-4444-4444-444444444444';

const baseGroup = {
  id: GROUP_ID,
  subjectId: 'sub-1',
  teacherId: TEACHER_ID,
  nombre: 'Inglés 1',
  periodo: '2026-1',
  codigo: 'GRP-000001',
  cupoMaximo: 30,
  cupoMinimo: 5,
  cupoActual: 10,
  horario: null,
  aula: null,
  edificio: null,
  modalidad: 'PRESENCIAL',
  estatus: 'EN_CURSO',
  nivelIngles: 1,
  costo: new Prisma.Decimal(1500),
  fechaInscripcionInicio: null,
  fechaInscripcionFin: null,
  esCursoIngles: true,
  deletedAt: null,
  subjects: { id: 'sub-1', clave: 'ING-1', nombre: 'Inglés Nivel 1', creditos: 0 },
  teachers: {
    id: TEACHER_ID,
    nombre: 'Ana',
    apellidoPaterno: 'López',
    apellidoMaterno: 'García',
    departamento: 'Idiomas',
  },
};

describe('getGroupById — control de acceso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.groups.findUnique.mockResolvedValue(baseGroup);
  });

  it('ADMIN puede leer cualquier grupo activo con costo', async () => {
    const result = await getGroupById(GROUP_ID, 'admin-user', 'ADMIN');
    expect(result).not.toBeNull();
    expect(result?.costo).toBe(1500);
    expect(prismaMock.teachers.findUnique).not.toHaveBeenCalled();
  });

  it('TEACHER ajeno recibe null (404 en controlador)', async () => {
    prismaMock.teachers.findUnique.mockResolvedValue({ id: 'other-teacher' });
    const result = await getGroupById(GROUP_ID, OTHER_TEACHER_USER_ID, 'TEACHER');
    expect(result).toBeNull();
  });

  it('TEACHER propietario recibe el grupo sin costo', async () => {
    prismaMock.teachers.findUnique.mockResolvedValue({ id: TEACHER_ID });
    const result = await getGroupById(GROUP_ID, TEACHER_USER_ID, 'TEACHER');
    expect(result).not.toBeNull();
    expect(result?.nombre).toBe('Inglés 1');
    expect(result).not.toHaveProperty('costo');
  });

  it('grupo eliminado devuelve null para TEACHER aunque sea propietario', async () => {
    prismaMock.groups.findUnique.mockResolvedValue({
      ...baseGroup,
      deletedAt: new Date(),
    });
    prismaMock.teachers.findUnique.mockResolvedValue({ id: TEACHER_ID });
    const result = await getGroupById(GROUP_ID, TEACHER_USER_ID, 'TEACHER');
    expect(result).toBeNull();
  });

  it('STUDENT inscrito vía enrollment legacy puede leer el grupo', async () => {
    prismaMock.students.findUnique.mockResolvedValue({ id: 'student-1' });
    prismaMock.enrollments.findFirst.mockResolvedValue({ id: 'enr-1' });
    const result = await getGroupById(GROUP_ID, 'student-user', 'STUDENT');
    expect(result).not.toBeNull();
    expect(prismaMock.academic_activities.findFirst).not.toHaveBeenCalled();
  });

  it('STUDENT no inscrito recibe null', async () => {
    prismaMock.students.findUnique.mockResolvedValue({ id: 'student-1' });
    prismaMock.enrollments.findFirst.mockResolvedValue(null);
    prismaMock.academic_activities.findFirst.mockResolvedValue(null);
    const result = await getGroupById(GROUP_ID, 'student-user', 'STUDENT');
    expect(result).toBeNull();
  });
});

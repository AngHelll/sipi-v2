// Regresión: forma del `where` en getAllExams.
//
// academic_activities.exams es una relación uno-a-uno, por lo que el filtro debe
// ser directo (`is`) y NUNCA `{ some: ... }`. Un `some` aquí provocaba un 400 en
// runtime (Unknown argument `some`) en la vista de Aprobaciones de Pago de Inglés.
// Estos tests fijan el contrato del filtro para que la regresión no vuelva.

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: {
    academic_activities: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import prisma from '../../../../config/database';
import { getAllExams } from '../exams.service';

const prismaMock = prisma as unknown as {
  academic_activities: { count: jest.Mock; findMany: jest.Mock };
};

describe('getAllExams — forma del filtro where', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.academic_activities.count.mockResolvedValue(0);
    prismaMock.academic_activities.findMany.mockResolvedValue([]);
  });

  it('filtra la relación exams de forma directa (is), nunca con `some`', async () => {
    await getAllExams({ examType: 'DIAGNOSTICO', estatus: 'PENDIENTE_PAGO', periodId: 'p1' });

    const countWhere = prismaMock.academic_activities.count.mock.calls[0][0].where;
    const findWhere = prismaMock.academic_activities.findMany.mock.calls[0][0].where;

    expect(countWhere.activityType).toBe('EXAM');
    expect(countWhere.estatus).toBe('PENDIENTE_PAGO');
    // Filtro directo de la relación 1-1
    expect(countWhere.exams).toEqual({ examType: 'DIAGNOSTICO', periodId: 'p1' });
    // Lo crítico: jamás un filtro de lista
    expect(countWhere.exams).not.toHaveProperty('some');
    expect(findWhere.exams).toEqual({ examType: 'DIAGNOSTICO', periodId: 'p1' });
    expect(findWhere.exams).not.toHaveProperty('some');
  });

  it('no agrega el sub-filtro exams cuando no hay examType ni periodId', async () => {
    await getAllExams({ estatus: 'PENDIENTE_PAGO' });

    const countWhere = prismaMock.academic_activities.count.mock.calls[0][0].where;
    expect(countWhere).not.toHaveProperty('exams');
  });

  it('calcula la paginación a partir del total', async () => {
    prismaMock.academic_activities.count.mockResolvedValue(45);
    const result = await getAllExams({ limit: 20, page: 2 });

    expect(result.pagination).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3 });
  });
});

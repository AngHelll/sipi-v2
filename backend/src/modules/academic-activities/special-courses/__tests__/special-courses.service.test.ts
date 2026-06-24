// Regresión: forma del `where` en getAllSpecialCourses.
//
// academic_activities.special_courses es relación uno-a-uno: el filtro debe ser
// directo, nunca `{ some: ... }`. Además los cursos completados por diagnóstico se
// excluyen siempre del listado (completadoPorDiagnostico: false).

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
import { getAllSpecialCourses } from '../special-courses.service';

const prismaMock = prisma as unknown as {
  academic_activities: { count: jest.Mock; findMany: jest.Mock };
};

describe('getAllSpecialCourses — forma del filtro where', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.academic_activities.count.mockResolvedValue(0);
    prismaMock.academic_activities.findMany.mockResolvedValue([]);
  });

  it('filtra special_courses de forma directa y excluye completados por diagnóstico', async () => {
    await getAllSpecialCourses({ courseType: 'INGLES', nivelIngles: 2 });

    const countWhere = prismaMock.academic_activities.count.mock.calls[0][0].where;
    const findWhere = prismaMock.academic_activities.findMany.mock.calls[0][0].where;

    expect(countWhere.activityType).toBe('SPECIAL_COURSE');
    expect(countWhere.special_courses).toEqual({
      courseType: 'INGLES',
      nivelIngles: 2,
      completadoPorDiagnostico: false,
    });
    expect(countWhere.special_courses).not.toHaveProperty('some');
    expect(findWhere.special_courses).not.toHaveProperty('some');
  });

  it('siempre excluye completados por diagnóstico aunque no haya filtros', async () => {
    await getAllSpecialCourses({});

    const countWhere = prismaMock.academic_activities.count.mock.calls[0][0].where;
    expect(countWhere.special_courses).toEqual({ completadoPorDiagnostico: false });
  });

  it('calcula la paginación a partir del total', async () => {
    prismaMock.academic_activities.count.mockResolvedValue(10);
    const result = await getAllSpecialCourses({ limit: 4, page: 1 });

    expect(result.pagination).toEqual({ page: 1, limit: 4, total: 10, totalPages: 3 });
  });
});

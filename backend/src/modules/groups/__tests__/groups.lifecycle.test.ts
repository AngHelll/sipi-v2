// Regresión del ciclo de vida de grupos:
// - getAllGroups filtra por baja lógica (deletedAt) y normaliza filtros.
// - deleteGroup hace baja lógica (marca deletedAt) e invalida la caché del listado.
// - restoreGroup revierte la baja e invalida la caché.

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    groups: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/cache', () => ({
  __esModule: true,
  cache: {
    get: jest.fn(() => null), // siempre miss → fuerza la consulta
    set: jest.fn(),
    invalidatePrefix: jest.fn(),
  },
  generateCacheKey: jest.fn(() => 'groups:list:test'),
}));

import prisma from '../../../config/database';
import { cache } from '../../../utils/cache';
import { getAllGroups, deleteGroup, restoreGroup } from '../groups.service';

const prismaMock = prisma as unknown as {
  groups: {
    count: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};
const cacheMock = cache as unknown as { invalidatePrefix: jest.Mock; get: jest.Mock };

describe('getAllGroups — filtro de baja lógica y normalización', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheMock.get.mockReturnValue(null);
    prismaMock.groups.count.mockResolvedValue(0);
    prismaMock.groups.findMany.mockResolvedValue([]);
  });

  it('por defecto solo devuelve grupos activos (deletedAt = null)', async () => {
    await getAllGroups({});
    const where = prismaMock.groups.count.mock.calls[0][0].where;
    expect(where.deletedAt).toBeNull();
  });

  it('con eliminados=true devuelve solo los dados de baja (deletedAt != null)', async () => {
    await getAllGroups({ eliminados: true });
    const where = prismaMock.groups.count.mock.calls[0][0].where;
    expect(where.deletedAt).toEqual({ not: null });
  });

  it('acepta eliminados como string "true" (query param)', async () => {
    await getAllGroups({ eliminados: 'true' as unknown as boolean });
    const where = prismaMock.groups.count.mock.calls[0][0].where;
    expect(where.deletedAt).toEqual({ not: null });
  });

  it('convierte estatus separado por comas en filtro { in: [...] }', async () => {
    await getAllGroups({ estatus: 'ABIERTO,EN_CURSO' });
    const where = prismaMock.groups.findMany.mock.calls[0][0].where;
    expect(where.estatus).toEqual({ in: ['ABIERTO', 'EN_CURSO'] });
  });

  it('un solo estatus se aplica como valor directo', async () => {
    await getAllGroups({ estatus: 'FINALIZADO' });
    const where = prismaMock.groups.findMany.mock.calls[0][0].where;
    expect(where.estatus).toBe('FINALIZADO');
  });

  it('normaliza esCursoIngles string "true" a boolean', async () => {
    await getAllGroups({ esCursoIngles: 'true' as unknown as boolean });
    const where = prismaMock.groups.findMany.mock.calls[0][0].where;
    expect(where.esCursoIngles).toBe(true);
  });
});

describe('deleteGroup — baja lógica', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marca deletedAt e invalida la caché del listado', async () => {
    prismaMock.groups.findUnique.mockResolvedValue({ id: 'g1', deletedAt: null });
    prismaMock.groups.update.mockResolvedValue({});

    await deleteGroup('g1');

    const updateArg = prismaMock.groups.update.mock.calls[0][0];
    expect(updateArg.where).toEqual({ id: 'g1' });
    expect(updateArg.data.deletedAt).toBeInstanceOf(Date);
    expect(cacheMock.invalidatePrefix).toHaveBeenCalledWith('groups:list');
  });

  it('es idempotente: re-eliminar un grupo ya dado de baja lanza error y no actualiza', async () => {
    prismaMock.groups.findUnique.mockResolvedValue({ id: 'g1', deletedAt: new Date() });

    await expect(deleteGroup('g1')).rejects.toThrow(/not found/i);
    expect(prismaMock.groups.update).not.toHaveBeenCalled();
  });

  it('lanza error cuando el grupo no existe', async () => {
    prismaMock.groups.findUnique.mockResolvedValue(null);
    await expect(deleteGroup('nope')).rejects.toThrow(/not found/i);
  });
});

describe('restoreGroup — revertir baja lógica', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pone deletedAt en null e invalida la caché', async () => {
    prismaMock.groups.findUnique.mockResolvedValue({ id: 'g1', deletedAt: new Date() });
    prismaMock.groups.update.mockResolvedValue({});

    await restoreGroup('g1');

    const updateArg = prismaMock.groups.update.mock.calls[0][0];
    expect(updateArg.data.deletedAt).toBeNull();
    expect(cacheMock.invalidatePrefix).toHaveBeenCalledWith('groups:list');
  });

  it('no hace nada si el grupo no estaba dado de baja', async () => {
    prismaMock.groups.findUnique.mockResolvedValue({ id: 'g1', deletedAt: null });
    await restoreGroup('g1');
    expect(prismaMock.groups.update).not.toHaveBeenCalled();
  });
});

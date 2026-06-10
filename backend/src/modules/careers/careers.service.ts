import prisma from '../../config/database';
import { CareerQueryDto, CareerResponseDto, CareersListResponseDto } from './careers.dtos';

const mapCareer = (career: {
  id: string;
  codigo: string;
  nombre: string;
  nombreCorto: string | null;
  area: string | null;
  duracionSemestres: number;
  estatus: string;
}): CareerResponseDto => ({
  id: career.id,
  codigo: career.codigo,
  nombre: career.nombre,
  nombreCorto: career.nombreCorto,
  area: career.area,
  duracionSemestres: career.duracionSemestres,
  estatus: career.estatus,
});

export const getAllCareers = async (
  query: CareerQueryDto = {}
): Promise<CareersListResponseDto> => {
  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (query.estatus) {
    where.estatus = query.estatus;
  } else {
    where.estatus = 'ACTIVA';
  }

  if (query.area) {
    where.area = query.area;
  }

  const careers = await prisma.careers.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });

  return {
    careers: careers.map(mapCareer),
  };
};

/** Resolve canonical nombre + carreraId from careers catalog */
export const resolveCareerFields = async (
  carrera: string,
  carreraId?: string | null
): Promise<{ carrera: string; carreraId: string | null }> => {
  if (carreraId) {
    const byId = await prisma.careers.findFirst({
      where: { id: carreraId, deletedAt: null, estatus: 'ACTIVA' },
    });
    if (byId) {
      return { carrera: byId.nombre, carreraId: byId.id };
    }
  }

  const trimmed = carrera.trim();
  const byNombre = await prisma.careers.findFirst({
    where: {
      nombre: trimmed,
      deletedAt: null,
      estatus: 'ACTIVA',
    },
  });

  if (byNombre) {
    return { carrera: byNombre.nombre, carreraId: byNombre.id };
  }

  return { carrera: trimmed, carreraId: null };
};

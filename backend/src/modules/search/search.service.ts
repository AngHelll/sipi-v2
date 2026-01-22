// Search service - Global search across all entities
import prisma from '../../config/database';
import type { SearchQueryDto, SearchResponseDto, SearchResultItem } from './search.dtos';

/**
 * Global search across students, teachers, subjects, and groups
 */
export const globalSearch = async (
  query: SearchQueryDto
): Promise<SearchResponseDto> => {
  const { q, limit = 10, types } = query;
  const searchTerm = q.trim().toLowerCase();
  const maxResults = Math.min(limit, 50); // Max 50 results

  if (!searchTerm || searchTerm.length < 2) {
    return {
      results: [],
      total: 0,
      query: q,
    };
  }

  const results: SearchResultItem[] = [];
  const searchTypes = types || ['student', 'teacher', 'subject', 'group'];

  // Search students
  if (searchTypes.includes('student')) {
    const students = await prisma.students.findMany({
      where: {
        OR: [
          { matricula: { contains: searchTerm } },
          { nombre: { contains: searchTerm } },
          { apellidoPaterno: { contains: searchTerm } },
          { apellidoMaterno: { contains: searchTerm } },
          { carrera: { contains: searchTerm } },
        ],
      },
      take: maxResults,
      select: {
        id: true,
        matricula: true,
        nombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        carrera: true,
        semestre: true,
      },
    });

    students.forEach((student) => {
      results.push({
        type: 'student',
        id: student.id,
        title: `${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno}`,
        subtitle: `Matrícula: ${student.matricula} | ${student.carrera} - Semestre ${student.semestre}`,
        metadata: {
          matricula: student.matricula,
          carrera: student.carrera,
          semestre: student.semestre,
        },
      });
    });
  }

  // Search teachers
  if (searchTypes.includes('teacher')) {
    const teachers = await prisma.teachers.findMany({
      where: {
        OR: [
          { nombre: { contains: searchTerm } },
          { apellidoPaterno: { contains: searchTerm } },
          { apellidoMaterno: { contains: searchTerm } },
          { departamento: { contains: searchTerm } },
        ],
      },
      take: maxResults,
      select: {
        id: true,
        nombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        departamento: true,
      },
    });

    teachers.forEach((teacher) => {
      results.push({
        type: 'teacher',
        id: teacher.id,
        title: `${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`,
        subtitle: `Departamento: ${teacher.departamento}`,
        metadata: {
          departamento: teacher.departamento,
        },
      });
    });
  }

  // Search subjects
  if (searchTypes.includes('subject')) {
    const subjects = await prisma.subjects.findMany({
      where: {
        OR: [
          { clave: { contains: searchTerm.toUpperCase() } },
          { nombre: { contains: searchTerm } },
        ],
      },
      take: maxResults,
      select: {
        id: true,
        clave: true,
        nombre: true,
        creditos: true,
      },
    });

    subjects.forEach((subject) => {
      results.push({
        type: 'subject',
        id: subject.id,
        title: `${subject.clave} - ${subject.nombre}`,
        subtitle: `${subject.creditos} créditos`,
        metadata: {
          clave: subject.clave,
          creditos: subject.creditos,
        },
      });
    });
  }

  // Search groups
  if (searchTypes.includes('group')) {
    const groups = await prisma.groups.findMany({
      where: {
        OR: [
          { nombre: { contains: searchTerm } },
          { periodo: { contains: searchTerm } },
        ],
      },
      take: maxResults,
      include: {
        subjects: {
          select: {
            clave: true,
            nombre: true,
          },
        },
        teachers: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
          },
        },
      },
    });

    groups.forEach((group) => {
      results.push({
        type: 'group',
        id: group.id,
        title: `${group.nombre} - ${group.subjects.clave}`,
        subtitle: `${group.subjects.nombre} | ${group.periodo} | ${group.teachers.nombre} ${group.teachers.apellidoPaterno}`,
        metadata: {
          periodo: group.periodo,
          subjectClave: group.subjects.clave,
        },
      });
    });
  }

  // Limit total results
  const limitedResults = results.slice(0, maxResults);

  return {
    results: limitedResults,
    total: limitedResults.length,
    query: q,
  };
};


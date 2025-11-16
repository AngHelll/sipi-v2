// Export service - Generate Excel files for data export
import ExcelJS from 'exceljs';
import prisma from '../../config/database';

/**
 * Export students to Excel
 */
export const exportStudents = async (filters?: {
  carrera?: string;
  semestre?: number;
  estatus?: string;
}): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Estudiantes');

  // Define columns
  worksheet.columns = [
    { header: 'Matrícula', key: 'matricula', width: 15 },
    { header: 'Nombre', key: 'nombre', width: 20 },
    { header: 'Apellido Paterno', key: 'apellidoPaterno', width: 20 },
    { header: 'Apellido Materno', key: 'apellidoMaterno', width: 20 },
    { header: 'Carrera', key: 'carrera', width: 30 },
    { header: 'Semestre', key: 'semestre', width: 10 },
    { header: 'Estatus', key: 'estatus', width: 12 },
    { header: 'CURP', key: 'curp', width: 18 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Build where clause
  const where: Record<string, unknown> = {};
  if (filters?.carrera) {
    where.carrera = { contains: filters.carrera };
  }
  if (filters?.semestre) {
    where.semestre = filters.semestre;
  }
  if (filters?.estatus) {
    where.estatus = filters.estatus;
  }

  // Fetch all students (for export, we want all matching records)
  const students = await prisma.student.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });

  // Add data rows
  students.forEach((student) => {
    worksheet.addRow({
      matricula: student.matricula,
      nombre: student.nombre,
      apellidoPaterno: student.apellidoPaterno,
      apellidoMaterno: student.apellidoMaterno,
      carrera: student.carrera,
      semestre: student.semestre,
      estatus: student.estatus,
      curp: student.curp || '',
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Export teachers to Excel
 */
export const exportTeachers = async (filters?: {
  departamento?: string;
}): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Maestros');

  worksheet.columns = [
    { header: 'Nombre', key: 'nombre', width: 20 },
    { header: 'Apellido Paterno', key: 'apellidoPaterno', width: 20 },
    { header: 'Apellido Materno', key: 'apellidoMaterno', width: 20 },
    { header: 'Departamento', key: 'departamento', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const where: Record<string, unknown> = {};
  if (filters?.departamento) {
    where.departamento = { contains: filters.departamento };
  }

  const teachers = await prisma.teacher.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });

  teachers.forEach((teacher) => {
    worksheet.addRow({
      nombre: teacher.nombre,
      apellidoPaterno: teacher.apellidoPaterno,
      apellidoMaterno: teacher.apellidoMaterno,
      departamento: teacher.departamento,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Export subjects to Excel
 */
export const exportSubjects = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Materias');

  worksheet.columns = [
    { header: 'Clave', key: 'clave', width: 15 },
    { header: 'Nombre', key: 'nombre', width: 40 },
    { header: 'Créditos', key: 'creditos', width: 10 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const subjects = await prisma.subject.findMany({
    orderBy: { clave: 'asc' },
  });

  subjects.forEach((subject) => {
    worksheet.addRow({
      clave: subject.clave,
      nombre: subject.nombre,
      creditos: subject.creditos,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Export groups to Excel
 */
export const exportGroups = async (filters?: {
  periodo?: string;
  subjectId?: string;
}): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Grupos');

  worksheet.columns = [
    { header: 'Nombre', key: 'nombre', width: 15 },
    { header: 'Período', key: 'periodo', width: 12 },
    { header: 'Clave Materia', key: 'subjectClave', width: 15 },
    { header: 'Materia', key: 'subjectNombre', width: 30 },
    { header: 'Maestro', key: 'teacherNombre', width: 30 },
    { header: 'Departamento', key: 'departamento', width: 25 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const where: Record<string, unknown> = {};
  if (filters?.periodo) {
    where.periodo = { contains: filters.periodo };
  }
  if (filters?.subjectId) {
    where.subjectId = filters.subjectId;
  }

  const groups = await prisma.group.findMany({
    where,
    include: {
      subject: {
        select: {
          clave: true,
          nombre: true,
        },
      },
      teacher: {
        select: {
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          departamento: true,
        },
      },
    },
    orderBy: { periodo: 'desc' },
  });

  groups.forEach((group) => {
    worksheet.addRow({
      nombre: group.nombre,
      periodo: group.periodo,
      subjectClave: group.subject.clave,
      subjectNombre: group.subject.nombre,
      teacherNombre: `${group.teacher.nombre} ${group.teacher.apellidoPaterno} ${group.teacher.apellidoMaterno}`,
      departamento: group.teacher.departamento,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};


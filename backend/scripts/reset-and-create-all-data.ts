#!/usr/bin/env ts-node
/**
 * Master script to purge database and create all test data
 * Usage: npm run reset:all-data
 * Or: npx ts-node scripts/reset-and-create-all-data.ts
 * 
 * This script will:
 * 1. Purge all data (except admin)
 * 2. Create careers
 * 3. Create students (100)
 * 4. Create teachers (10)
 * 5. Create subjects (15)
 * 6. Create groups (25)
 * 7. Create enrollments (50)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { recalculateStudentAverages } from '../src/modules/students/students.service';

dotenv.config();
const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// ============================================
// DATA ARRAYS
// ============================================

const careers = [
  { codigo: 'IS', nombre: 'Ingeniería en Sistemas', area: 'Ingeniería', duracionSemestres: 10 },
  { codigo: 'II', nombre: 'Ingeniería Industrial', area: 'Ingeniería', duracionSemestres: 10 },
  { codigo: 'ADM', nombre: 'Administración', area: 'Ciencias Sociales', duracionSemestres: 8 },
  { codigo: 'DER', nombre: 'Derecho', area: 'Ciencias Sociales', duracionSemestres: 10 },
  { codigo: 'CON', nombre: 'Contaduría', area: 'Ciencias Económicas', duracionSemestres: 8 },
];

const nombres = [
  'María', 'José', 'Juan', 'Ana', 'Carlos', 'Laura', 'Miguel', 'Carmen',
  'Luis', 'Patricia', 'Pedro', 'Guadalupe', 'Francisco', 'Rosa', 'Javier',
  'Mónica', 'Antonio', 'Alejandra', 'Manuel', 'Verónica', 'Ricardo', 'Diana',
  'Fernando', 'Sandra', 'Roberto', 'Gabriela', 'Daniel', 'Mariana', 'Eduardo',
  'Andrea', 'Jorge', 'Paola', 'Alberto', 'Claudia', 'Sergio', 'Liliana',
  'Raúl', 'Adriana', 'Oscar', 'Lucía', 'Diego', 'Natalia', 'Andrés', 'Elena',
];

const apellidos = [
  'García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Hernández', 'Jiménez',
  'Ruiz', 'Torres', 'Díaz', 'Vargas', 'Castro', 'Romero', 'Soto', 'Mendoza',
];

const materias = [
  { clave: 'MAT-101', nombre: 'Álgebra Lineal', creditos: 6, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 4, horasPractica: 2, horasLaboratorio: 0 },
  { clave: 'MAT-102', nombre: 'Cálculo Diferencial', creditos: 6, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 4, horasPractica: 2, horasLaboratorio: 0 },
  { clave: 'IS-101', nombre: 'Programación I', creditos: 6, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 3, horasPractica: 1, horasLaboratorio: 2 },
  { clave: 'IS-102', nombre: 'Estructuras de Datos', creditos: 6, tipo: 'OBLIGATORIA', nivel: 2, horasTeoria: 3, horasPractica: 1, horasLaboratorio: 2 },
  { clave: 'IS-201', nombre: 'Programación II', creditos: 6, tipo: 'OBLIGATORIA', nivel: 2, horasTeoria: 3, horasPractica: 1, horasLaboratorio: 2 },
  { clave: 'IS-202', nombre: 'Bases de Datos', creditos: 6, tipo: 'OBLIGATORIA', nivel: 2, horasTeoria: 3, horasPractica: 1, horasLaboratorio: 2 },
  { clave: 'IS-301', nombre: 'Ingeniería de Software', creditos: 6, tipo: 'OBLIGATORIA', nivel: 3, horasTeoria: 4, horasPractica: 2, horasLaboratorio: 0 },
  { clave: 'IS-302', nombre: 'Sistemas Operativos', creditos: 5, tipo: 'OBLIGATORIA', nivel: 3, horasTeoria: 3, horasPractica: 1, horasLaboratorio: 1 },
  { clave: 'IS-401', nombre: 'Desarrollo Web', creditos: 6, tipo: 'OBLIGATORIA', nivel: 4, horasTeoria: 2, horasPractica: 2, horasLaboratorio: 2 },
  { clave: 'II-101', nombre: 'Introducción a la Ingeniería Industrial', creditos: 4, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 3, horasPractica: 1, horasLaboratorio: 0 },
  { clave: 'II-201', nombre: 'Estadística Aplicada', creditos: 6, tipo: 'OBLIGATORIA', nivel: 2, horasTeoria: 4, horasPractica: 2, horasLaboratorio: 0 },
  { clave: 'ADM-101', nombre: 'Introducción a la Administración', creditos: 4, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 4, horasPractica: 0, horasLaboratorio: 0 },
  { clave: 'ADM-201', nombre: 'Contabilidad General', creditos: 6, tipo: 'OBLIGATORIA', nivel: 2, horasTeoria: 3, horasPractica: 3, horasLaboratorio: 0 },
  { clave: 'DER-101', nombre: 'Introducción al Derecho', creditos: 4, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 4, horasPractica: 0, horasLaboratorio: 0 },
  { clave: 'CON-101', nombre: 'Principios de Contabilidad', creditos: 5, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 3, horasPractica: 2, horasLaboratorio: 0 },
  // RB-037: Materias de inglés (separadas del promedio general)
  { clave: 'ING-101', nombre: 'Inglés I', creditos: 4, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 3, horasPractica: 1, horasLaboratorio: 0 },
  { clave: 'ING-201', nombre: 'Inglés II', creditos: 4, tipo: 'OBLIGATORIA', nivel: 2, horasTeoria: 3, horasPractica: 1, horasLaboratorio: 0 },
  { clave: 'LE-001', nombre: 'INGLES 1', creditos: 10, tipo: 'OBLIGATORIA', nivel: 1, horasTeoria: 4, horasPractica: 2, horasLaboratorio: 0 },
  { clave: 'LE-002', nombre: 'INGLES 2', creditos: 10, tipo: 'OBLIGATORIA', nivel: 2, horasTeoria: 4, horasPractica: 2, horasLaboratorio: 0 },
];

const departamentos = [
  'Ciencias Básicas',
  'Ingeniería en Sistemas',
  'Ingeniería Industrial',
  'Administración',
  'Derecho',
  'Contaduría',
];

const gradosAcademicos = [
  'Licenciatura',
  'Maestría',
  'Doctorado',
];

const especialidades = [
  'Ciencias de la Computación',
  'Ingeniería de Software',
  'Inteligencia Artificial',
  'Bases de Datos',
  'Redes de Computadoras',
  'Administración de Empresas',
  'Recursos Humanos',
  'Finanzas',
  'Derecho Civil',
  'Derecho Penal',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateCURP(nombre: string, apellidoPaterno: string, apellidoMaterno: string, index: number): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  const firstLetter = apellidoPaterno[0] || 'X';
  const secondLetter = apellidoPaterno[1] || 'X';
  const thirdLetter = apellidoMaterno[0] || 'X';
  const fourthLetter = nombre[0] || 'X';
  const year = String(randomInt(1995, 2005)).slice(-2);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  const gender = randomElement(['H', 'M']);
  const state = 'MX';
  const randomLetters = randomElement(letras.split('')) + randomElement(letras.split(''));
  const randomNumber = randomElement(numeros.split(''));
  return `${firstLetter}${secondLetter}${thirdLetter}${fourthLetter}${year}${month}${day}${gender}${state}${randomLetters}${randomNumber}`;
}

function generateMatricula(year: number, index: number): string {
  return `${year}-${String(index).padStart(6, '0')}`;
}

// ============================================
// PURGE FUNCTION
// ============================================

async function purgeDatabase() {
  console.log('🧹 Purging database...\n');

  // V2: Primero eliminar historiales y actividades académicas
  // Orden respetando claves foráneas:
  // activity_history -> (enrollments_v2, exams, special_courses, social_service, professional_practices)
  // -> academic_activities -> resto de tablas
  try {
    // V2: Historial de actividades y tablas nuevas
    await prisma.activity_history.deleteMany({});
    await prisma.enrollments_v2.deleteMany({});
    await prisma.exams.deleteMany({});
    await prisma.special_courses.deleteMany({});
    await prisma.social_service.deleteMany({});
    await prisma.professional_practices.deleteMany({});
  } catch (error: any) {
    console.warn('⚠️  Warning purging V2 academic activities (can be ignored on fresh DB):', error.message);
  }

  try {
    await prisma.academic_activities.deleteMany({});
  } catch (error: any) {
    console.warn('⚠️  Warning purging academic_activities (can be ignored on fresh DB):', error.message);
  }

  // Tablas legacy
  await prisma.enrollment_history.deleteMany({});
  await prisma.academic_history.deleteMany({});
  await prisma.student_documents.deleteMany({});
  await prisma.enrollments.deleteMany({});
  await prisma.groups.deleteMany({});
  await prisma.prerequisites.deleteMany({});
  await prisma.subjects.deleteMany({});
  await prisma.academic_periods.deleteMany({});
  await prisma.students.deleteMany({});
  await prisma.teachers.deleteMany({});
  await prisma.careers.deleteMany({});
  
  const adminUser = await prisma.users.findUnique({
    where: { username: 'admin' },
  });

  if (adminUser) {
    await prisma.users.deleteMany({
      where: { username: { not: 'admin' } },
    });
  } else {
    await prisma.users.deleteMany({});
  }

  console.log('✅ Database purged\n');
}

// ============================================
// CREATE FUNCTIONS
// ============================================

async function createCareers() {
  console.log('📚 Creating careers...');
  let created = 0;

  // Import uuid if needed, or use a simple counter
  const { randomUUID } = await import('crypto');

  for (const careerData of careers) {
    try {
      await prisma.careers.create({
        data: {
          id: randomUUID(),
          codigo: careerData.codigo,
          nombre: careerData.nombre,
          area: careerData.area,
          duracionSemestres: careerData.duracionSemestres,
          estatus: 'ACTIVA',
        } as any,
      });
      created++;
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`   ❌ Error creating career ${careerData.codigo}:`, error.message);
      }
    }
  }

  console.log(`   ✅ Created ${created} careers\n`);
  return await prisma.careers.findMany();
}

async function createStudents(count: number = 100) {
  console.log(`👨‍🎓 Creating ${count} students...`);
  const createdCareers = await prisma.careers.findMany();
  if (createdCareers.length === 0) {
    throw new Error('No careers found. Please create careers first.');
  }

  const currentYear = new Date().getFullYear();
  let created = 0;

  for (let i = 1; i <= count; i++) {
    try {
      const nombre = randomElement(nombres);
      const apellidoPaterno = randomElement(apellidos);
      const apellidoMaterno = randomElement(apellidos);
      const carrera = randomElement(createdCareers);
      const semestre = randomInt(1, 8);
      const estatus = randomElement(['ACTIVO', 'ACTIVO', 'ACTIVO', 'INACTIVO']); // 75% activos
      const matricula = generateMatricula(currentYear - Math.floor(semestre / 2), i);
      const curp = generateCURP(nombre, apellidoPaterno, apellidoMaterno, i);
      const username = `${nombre.toLowerCase()}.${apellidoPaterno.toLowerCase()}${i}`;
      const email = `${username}@estudiante.edu.mx`;
      const telefono = `55${randomInt(1000, 9999)}${randomInt(1000, 9999)}`;
      const fechaNacimiento = randomDate(new Date(1995, 0, 1), new Date(2005, 11, 31));
      const genero = randomElement(['MASCULINO', 'FEMENINO']);
      const tipoIngreso = randomElement(['NUEVO_INGRESO', 'REINGRESO', 'TRANSFERENCIA']);
      const fechaIngreso = randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1));
      const promedioGeneral = estatus === 'ACTIVO' ? randomInt(70, 100) : randomInt(50, 95);
      const creditosCursados = semestre * 30;
      const creditosAprobados = Math.floor(creditosCursados * (promedioGeneral / 100));
      const beca = randomInt(1, 10) <= 2; // 20% con beca

      const passwordHash = await bcrypt.hash('password123', 10);

      const { randomUUID } = await import('crypto');

      const result = await prisma.$transaction(async (tx) => {
        const userId = randomUUID();
        const studentId = randomUUID();
        
        const user = await tx.users.create({
          data: {
            id: userId,
            username,
            passwordHash,
            role: 'STUDENT',
            email,
            telefono,
            updatedAt: new Date(),
          } as any,
        });

        const student = await tx.students.create({
          data: {
            id: studentId,
            userId: user.id,
            matricula,
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            carrera: carrera.nombre,
            carreraId: carrera.id,
            semestre,
            estatus: estatus as any,
            curp,
            email,
            telefono,
            fechaNacimiento,
            genero: genero as any,
            nacionalidad: 'Mexicana',
            lugarNacimiento: 'Ciudad de México',
            direccion: `Calle ${randomInt(1, 200)} #${randomInt(1, 999)}`,
            ciudad: 'Ciudad de México',
            estado: 'CDMX',
            codigoPostal: `${randomInt(10000, 99999)}`,
            pais: 'México',
            tipoIngreso: tipoIngreso as any,
            fechaIngreso,
            promedioGeneral,
            creditosCursados,
            creditosAprobados,
            creditosTotales: carrera.duracionSemestres * 30,
            beca,
            tipoBeca: beca ? randomElement(['Académica', 'Deportiva', 'Socioeconómica']) : undefined,
            updatedAt: new Date(),
          } as any,
        });

        return { user, student };
      });

      created++;
      if (i % 10 === 0) {
        process.stdout.write(`   Progress: ${i}/${count}\r`);
      }
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`\n   ❌ Error creating student ${i}:`, error.message);
      }
    }
  }

  console.log(`\n   ✅ Created ${created} students\n`);
}

async function createTeachers(count: number = 10) {
  console.log(`👨‍🏫 Creating ${count} teachers...`);
  let created = 0;

  for (let i = 1; i <= count; i++) {
    try {
      const nombre = randomElement(nombres);
      const apellidoPaterno = randomElement(apellidos);
      const apellidoMaterno = randomElement(apellidos);
      const departamento = randomElement(departamentos);
      const username = `prof.${apellidoPaterno.toLowerCase()}${i}`;
      const email = `${username}@universidad.edu.mx`;
      const telefono = `55${randomInt(1000, 9999)}${randomInt(1000, 9999)}`;
      const fechaNacimiento = randomDate(new Date(1970, 0, 1), new Date(1990, 11, 31));
      const genero = randomElement(['MASCULINO', 'FEMENINO']);
      const gradoAcademico = randomElement(gradosAcademicos);
      const especialidad = randomElement(especialidades);
      const tipoContrato = randomElement(['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'POR_HONORARIOS']);
      const fechaContratacion = randomDate(new Date(2015, 0, 1), new Date(2023, 11, 31));
      const estatus = randomElement(['ACTIVO', 'ACTIVO', 'ACTIVO', 'INACTIVO']);
      const salario = tipoContrato === 'TIEMPO_COMPLETO' ? randomInt(25000, 50000) : randomInt(15000, 30000);

      const passwordHash = await bcrypt.hash('password123', 10);

      const { randomUUID } = await import('crypto');

      const result = await prisma.$transaction(async (tx) => {
        const userId = randomUUID();
        const teacherId = randomUUID();
        
        const user = await tx.users.create({
          data: {
            id: userId,
            username,
            passwordHash,
            role: 'TEACHER',
            email,
            telefono,
            updatedAt: new Date(),
          } as any,
        });

        const teacher = await tx.teachers.create({
          data: {
            id: teacherId,
            userId: user.id,
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            departamento,
            email,
            telefono,
            gradoAcademico,
            especialidad,
            cedulaProfesional: `C${randomInt(100000, 999999)}`,
            universidad: randomElement(['UNAM', 'IPN', 'UAM', 'ITESM', 'UANL']),
            tipoContrato: tipoContrato as any,
            fechaContratacion,
            estatus: estatus as any,
            salario,
            gruposAsignados: 0,
            updatedAt: new Date(),
          } as any,
        });

        return { user, teacher };
      });

      created++;
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`   ❌ Error creating teacher ${i}:`, error.message);
        if (error.message && error.message.length < 200) {
          console.error(`   Details:`, error.message);
        }
      }
    }
  }

  console.log(`   ✅ Created ${created} teachers\n`);
}

async function createSubjects() {
  console.log('📖 Creating subjects...');
  const createdCareers = await prisma.careers.findMany();
  if (createdCareers.length === 0) {
    throw new Error('No careers found. Please create careers first.');
  }

  let created = 0;

  const { randomUUID } = await import('crypto');

  for (const materia of materias) {
    try {
      // Find matching career by code prefix
      const career = createdCareers.find(c => materia.clave.startsWith(c.codigo));
      
      await prisma.subjects.create({
        data: {
          id: randomUUID(),
          clave: materia.clave,
          nombre: materia.nombre,
          creditos: materia.creditos,
          tipo: materia.tipo as any,
          estatus: 'ACTIVA',
          nivel: materia.nivel,
          horasTeoria: materia.horasTeoria,
          horasPractica: materia.horasPractica,
          horasLaboratorio: materia.horasLaboratorio,
          carreraId: career?.id,
          updatedAt: new Date(),
        } as any,
      });
      created++;
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`   ❌ Error creating subject ${materia.clave}:`, error.message);
      }
    }
  }

  console.log(`   ✅ Created ${created} subjects\n`);
}

async function createGroups(count: number = 25) {
  console.log(`👥 Creating ${count} groups...`);
  const subjects = await prisma.subjects.findMany();
  const teachers = await prisma.teachers.findMany();

  if (subjects.length === 0 || teachers.length === 0) {
    throw new Error('No subjects or teachers found.');
  }

  const periodos = ['2024-1', '2024-2', '2025-1'];
  const nombresGrupos = ['A', 'B', 'C', 'D'];
  const modalidades = ['PRESENCIAL', 'VIRTUAL', 'HIBRIDO'];
  let created = 0;

  for (let i = 0; i < count; i++) {
    try {
      const subject = randomElement(subjects);
      const teacher = randomElement(teachers);
      const periodo = randomElement(periodos);
      const nombreGrupo = randomElement(nombresGrupos);
      const modalidad = randomElement(modalidades);
      const cupoMaximo = randomInt(25, 40);
      const cupoMinimo = 5;
      const horario = `${randomElement(['L-M-V', 'M-J', 'L-M-J-V'])} ${randomInt(8, 18)}:00-${randomInt(10, 20)}:00`;
      const aula = `A${randomInt(100, 500)}`;
      const edificio = randomElement(['A', 'B', 'C', 'D']);

      const { randomUUID } = await import('crypto');

      await prisma.groups.create({
        data: {
          id: randomUUID(),
          subjectId: subject.id,
          teacherId: teacher.id,
          codigo: `${subject.clave}-${nombreGrupo}-${periodo}`,
          nombre: `Grupo ${nombreGrupo}`,
          periodo,
          cupoMaximo,
          cupoMinimo,
          cupoActual: 0,
          horario,
          aula,
          edificio,
          modalidad: modalidad as any,
          estatus: 'ABIERTO',
          updatedAt: new Date(),
        } as any,
      });

      created++;
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`   ❌ Error creating group ${i + 1}:`, error.message);
      }
    }
  }

  console.log(`   ✅ Created ${created} groups\n`);
}

async function createEnrollments(count: number = 50) {
  console.log(`📝 Creating ${count} enrollments...`);
  const students = await prisma.students.findMany();
  const groups = await prisma.groups.findMany({ include: { subjects: true } });

  if (students.length === 0 || groups.length === 0) {
    throw new Error('No students or groups found.');
  }

  let created = 0;
  const usedCombinations = new Set<string>();

  for (let i = 0; i < count; i++) {
    try {
      const student = randomElement(students);
      const group = randomElement(groups);
      const key = `${student.id}-${group.id}`;

      if (usedCombinations.has(key)) {
        continue; // Skip duplicate enrollments
      }

      // Check capacity
      if (group.cupoActual >= group.cupoMaximo) {
        continue; // Skip full groups
      }

      const tipoInscripcion = randomElement(['NORMAL', 'NORMAL', 'NORMAL', 'ESPECIAL', 'REPETICION']);
      const estatus = randomElement(['INSCRITO', 'EN_CURSO', 'APROBADO', 'REPROBADO']);
      const fechaInscripcion = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));

      const { randomUUID } = await import('crypto');

      const enrollment = await prisma.enrollments.create({
        data: {
          id: randomUUID(),
          studentId: student.id,
          groupId: group.id,
          codigo: `ENR-${student.id.substring(0, 4)}-${group.id.substring(0, 4)}-${Date.now()}`,
          fechaInscripcion,
          tipoInscripcion: tipoInscripcion as any,
          estatus: estatus as any,
          calificacion: estatus === 'APROBADO' ? randomInt(70, 100) : estatus === 'REPROBADO' ? randomInt(0, 69) : null,
          calificacionParcial1: estatus !== 'INSCRITO' ? randomInt(60, 100) : null,
          calificacionParcial2: estatus !== 'INSCRITO' ? randomInt(60, 100) : null,
          calificacionFinal: estatus !== 'INSCRITO' ? randomInt(60, 100) : null,
          asistencias: randomInt(15, 30),
          faltas: randomInt(0, 5),
          retardos: randomInt(0, 3),
          porcentajeAsistencia: randomInt(80, 100),
          aprobado: estatus === 'APROBADO' ? true : estatus === 'REPROBADO' ? false : null,
          updatedAt: new Date(),
        } as any,
      });

      // Update group capacity
      await prisma.groups.update({
        where: { id: group.id },
        data: { cupoActual: { increment: 1 } },
      });

      // RB-037: Recalculate student averages if enrollment has a grade
      if (enrollment.calificacionFinal || enrollment.calificacion) {
        try {
          await recalculateStudentAverages(student.id);
        } catch (error: any) {
          // Log but don't fail - this is a background operation
          console.error(`   ⚠️  Warning: Could not recalculate averages for student ${student.matricula}:`, error.message);
        }
      }

      usedCombinations.add(key);
      created++;
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`   ❌ Error creating enrollment ${i + 1}:`, error.message);
      }
    }
  }

  console.log(`   ✅ Created ${created} enrollments\n`);
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🔄 RESET AND CREATE ALL TEST DATA                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const autoConfirm =
    process.env.RESET_ALL_DATA_AUTO === 'true' ||
    process.argv.includes('--yes') ||
    process.argv.includes('--auto');

  if (!autoConfirm) {
    const answer = await question('⚠️  This will DELETE ALL DATA (except admin). Continue? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      rl.close();
      return;
    }
  } else {
    console.log('⚠️  AUTO MODE: Deleting ALL DATA (except admin) without confirmation (RESET_ALL_DATA_AUTO).\n');
  }

  try {
    await purgeDatabase();
    const careers = await createCareers();
    await createStudents(100);
    await createTeachers(10);
    await createSubjects();
    await createGroups(25);
    await createEnrollments(80); // Increased to ensure more English enrollments
    
    // RB-037: Recalculate all student averages after creating enrollments
    console.log('📊 Recalculating student averages (RB-037)...');
    const allStudents = await prisma.students.findMany();
    let recalculated = 0;
    for (const student of allStudents) {
      try {
        await recalculateStudentAverages(student.id);
        recalculated++;
        if (recalculated % 20 === 0) {
          process.stdout.write(`   Progress: ${recalculated}/${allStudents.length}\r`);
        }
      } catch (error: any) {
        console.error(`   ⚠️  Warning: Could not recalculate averages for student ${student.matricula}:`, error.message);
      }
    }
    console.log(`\n   ✅ Recalculated averages for ${recalculated} students\n`);

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ ALL DATA CREATED SUCCESSFULLY!                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('📊 Summary:');
    console.log(`   - Careers: ${careers.length}`);
    console.log(`   - Students: ~100`);
    console.log(`   - Teachers: ~10`);
    console.log(`   - Subjects: ~19 (including 4 English subjects)`);
    console.log(`   - Groups: ~25`);
    console.log(`   - Enrollments: ~80\n`);
    console.log('💡 Default password for all users: password123\n');
    console.log('📝 RB-037: Student averages (promedioGeneral and promedioIngles) have been calculated\n');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });


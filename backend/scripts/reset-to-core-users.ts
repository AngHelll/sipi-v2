#!/usr/bin/env ts-node
/**
 * Reset to core users only (strategic clean state)
 *
 * Deja la base en un estado mínimo:
 *  - 1 admin (existente o creado si no existe)
 *  - 1 teacher
 *  - 1 student
 *
 * Sin materias, grupos, inscripciones, actividades V2 ni documentos.
 *
 * Uso:
 *   RESET_CORE_AUTO=true npx ts-node scripts/reset-to-core-users.ts
 */

import { createPrismaClient } from '../src/config/create-prisma-client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();
const prisma = createPrismaClient();

async function purgeToCore() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🔄 RESET TO CORE USERS (ADMIN / TEACHER / STUDENT)       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('🧹 Purging all transactional and catalog data...\n');

  // V2: Academic activities first (respect FK order)
  try {
    console.log('   - Deleting activity_history...');
    await prisma.activity_history.deleteMany({});
    console.log('   - Deleting enrollments_v2...');
    await prisma.enrollments_v2.deleteMany({});
    console.log('   - Deleting exams...');
    await prisma.exams.deleteMany({});
    console.log('   - Deleting special_courses...');
    await prisma.special_courses.deleteMany({});
    console.log('   - Deleting social_service...');
    await prisma.social_service.deleteMany({});
    console.log('   - Deleting professional_practices...');
    await prisma.professional_practices.deleteMany({});
    console.log('   - Deleting academic_activities...');
    await prisma.academic_activities.deleteMany({});
  } catch (error: any) {
    console.warn('⚠️  Warning purging V2 tables (likely fine on fresh DB):', error.message);
  }

  // Legacy academic/operational data
  await prisma.enrollment_history.deleteMany({});
  await prisma.academic_history.deleteMany({});
  await prisma.student_documents.deleteMany({});
  await prisma.enrollments.deleteMany({});
  await prisma.groups.deleteMany({});
  await prisma.prerequisites.deleteMany({});
  await prisma.subjects.deleteMany({});
  await prisma.academic_periods.deleteMany({});

  // Delete students / teachers / careers too, we will recreate a minimal set
  await prisma.students.deleteMany({});
  await prisma.teachers.deleteMany({});
  await prisma.careers.deleteMany({});

  // Keep (or create) admin user, remove the rest
  const existingAdmin = await prisma.users.findFirst({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    console.log('👨‍💼 Admin user not found, creating default admin (admin / password123)...');
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        username: 'admin',
        passwordHash,
        role: 'ADMIN',
        email: 'admin@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });
  }

  console.log('   - Deleting non-admin users...');
  await prisma.users.deleteMany({
    where: {
      username: { not: 'admin' },
    },
  });

  console.log('\n✅ Database purged to core users.\n');
}

async function createCoreUsers() {
  console.log('👷 Creating core teacher & student...\n');

  const passwordHash = await bcrypt.hash('password123', 10);
  const { randomUUID } = await import('crypto');

  // Minimal career so student has a valid FK
  const careerId = randomUUID();
  await prisma.careers.create({
    data: {
      id: careerId,
      codigo: 'IS',
      nombre: 'Ingeniería en Sistemas',
      area: 'Ingeniería',
      duracionSemestres: 10,
      estatus: 'ACTIVA',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  });

  // Teacher
  const teacherUserId = randomUUID();
  const teacherId = randomUUID();
  const teacherUser = await prisma.users.create({
    data: {
      id: teacherUserId,
      username: 'teacher1',
      passwordHash,
      role: 'TEACHER',
      email: 'teacher1@example.com',
      telefono: '5500000001',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  });

  await prisma.teachers.create({
    data: {
      id: teacherId,
      userId: teacherUser.id,
      nombre: 'Test',
      apellidoPaterno: 'Teacher',
      apellidoMaterno: 'Uno',
      departamento: 'Ciencias Básicas',
      email: teacherUser.email,
      telefono: teacherUser.telefono,
      gradoAcademico: 'Licenciatura',
      especialidad: 'Ingeniería de Software',
      cedulaProfesional: 'TST00001',
      universidad: 'UNAM',
      tipoContrato: 'TIEMPO_COMPLETO',
      estatus: 'ACTIVO',
      salario: 30000,
      gruposAsignados: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  });

  // Student
  const studentUserId = randomUUID();
  const studentId = randomUUID();
  const studentUser = await prisma.users.create({
    data: {
      id: studentUserId,
      username: 'student1',
      passwordHash,
      role: 'STUDENT',
      email: 'student1@example.com',
      telefono: '5500000002',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  });

  await prisma.students.create({
    data: {
      id: studentId,
      userId: studentUser.id,
      matricula: '2025-000001',
      nombre: 'Test',
      apellidoPaterno: 'Student',
      apellidoMaterno: 'Uno',
      carrera: 'Ingeniería en Sistemas',
      carreraId: careerId,
      semestre: 1,
      estatus: 'ACTIVO',
      curp: 'TSTU000000HDFRLS01',
      email: studentUser.email,
      telefono: studentUser.telefono,
      genero: 'MASCULINO',
      nacionalidad: 'Mexicana',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      pais: 'México',
      tipoIngreso: 'NUEVO_INGRESO',
      fechaIngreso: new Date(),
      promedioGeneral: null,
      promedioIngles: null,
      creditosCursados: 0,
      creditosAprobados: 0,
      beca: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  });

  console.log('✅ Core users created successfully.\n');

  console.log('📋 Credenciales:');
  console.log('   👨‍💼 ADMIN:');
  console.log('      Username: admin');
  console.log('      Password: password123');
  console.log('');
  console.log('   👨‍🏫 TEACHER:');
  console.log('      Username: teacher1');
  console.log('      Password: password123');
  console.log('');
  console.log('   👨‍🎓 STUDENT:');
  console.log('      Username: student1');
  console.log('      Password: password123');
  console.log('');
}

async function main() {
  try {
    await purgeToCore();
    await createCoreUsers();

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ RESET TO CORE USERS COMPLETED                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('💡 Estado final:');
    console.log('   - 1 admin (admin)');
    console.log('   - 1 teacher (teacher1)');
    console.log('   - 1 student (student1)');
    console.log('   - Sin materias, grupos, inscripciones ni actividades V2\n');
  } catch (error) {
    console.error('❌ Error in reset-to-core-users script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



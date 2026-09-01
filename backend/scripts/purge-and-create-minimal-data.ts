#!/usr/bin/env ts-node
/**
 * Script to purge database and create minimal test data
 * 
 * This script will:
 * 1. Purge all data EXCEPT: subjects, groups, diagnostic_exam_periods
 * 2. Create 1 admin user
 * 3. Create 1 teacher user
 * 4. Create 10 student users
 * 
 * Usage: npx ts-node scripts/purge-and-create-minimal-data.ts
 */

import { createPrismaClient } from '../src/config/create-prisma-client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();
const prisma = createPrismaClient();

async function purgeDatabase() {
  console.log('\n🧹 Purging database (preserving subjects, groups, and exam periods)...\n');

  try {
    // Delete in order to respect foreign key constraints
    
    // V2: Academic activities and related tables
    console.log('📝 Deleting activity history...');
    await prisma.activity_history.deleteMany({});
    console.log('   ✅ Activity history deleted');

    console.log('📝 Deleting special courses...');
    await prisma.special_courses.deleteMany({});
    console.log('   ✅ Special courses deleted');

    console.log('📝 Deleting exams...');
    await prisma.exams.deleteMany({});
    console.log('   ✅ Exams deleted');

    console.log('📝 Deleting enrollments_v2...');
    await prisma.enrollments_v2.deleteMany({});
    console.log('   ✅ Enrollments V2 deleted');

    console.log('📝 Deleting social service...');
    await prisma.social_service.deleteMany({});
    console.log('   ✅ Social service deleted');

    console.log('📝 Deleting professional practices...');
    await prisma.professional_practices.deleteMany({});
    console.log('   ✅ Professional practices deleted');

    console.log('📝 Deleting academic activities...');
    await prisma.academic_activities.deleteMany({});
    console.log('   ✅ Academic activities deleted');

    // Legacy tables
    console.log('📝 Deleting enrollment history...');
    await prisma.enrollment_history.deleteMany({});
    console.log('   ✅ Enrollment history deleted');

    console.log('📝 Deleting academic history...');
    await prisma.academic_history.deleteMany({});
    console.log('   ✅ Academic history deleted');

    console.log('📝 Deleting student documents...');
    await prisma.student_documents.deleteMany({});
    console.log('   ✅ Student documents deleted');

    console.log('📝 Deleting enrollments (legacy)...');
    await prisma.enrollments.deleteMany({});
    console.log('   ✅ Enrollments deleted');

    console.log('📝 Deleting prerequisites...');
    await prisma.prerequisites.deleteMany({});
    console.log('   ✅ Prerequisites deleted');

    // Students and Teachers
    console.log('📝 Deleting students...');
    await prisma.students.deleteMany({});
    console.log('   ✅ Students deleted');

    // Check if groups exist and have teacher references
    // Since teacherId is required, we need to preserve teachers that are referenced
    console.log('📝 Checking groups for teacher references...');
    const allGroups = await prisma.groups.findMany({
      select: { teacherId: true },
    });
    const teacherIdsInUse = [...new Set(allGroups.map(g => g.teacherId).filter((id): id is string => id !== null))];
    
    if (teacherIdsInUse.length > 0) {
      console.log(`   ℹ️  Found ${teacherIdsInUse.length} unique teachers referenced by groups`);
    } else {
      console.log('   ✅ No groups with teacher references found');
    }

    // Delete teachers that are not referenced by groups
    if (teacherIdsInUse.length > 0) {
      console.log('📝 Deleting teachers not referenced by groups...');
      await prisma.teachers.deleteMany({
        where: {
          id: {
            notIn: teacherIdsInUse,
          },
        },
      });
      console.log(`   ✅ Unused teachers deleted (${teacherIdsInUse.length} teachers preserved for groups)`);
    } else {
      console.log('📝 Deleting all teachers...');
      await prisma.teachers.deleteMany({});
      console.log('   ✅ All teachers deleted');
    }

    // Careers
    console.log('📝 Deleting careers...');
    await prisma.careers.deleteMany({});
    console.log('   ✅ Careers deleted');

    // Academic periods (except we might want to keep some, but user said only subjects, groups, exams)
    console.log('📝 Deleting academic periods...');
    await prisma.academic_periods.deleteMany({});
    console.log('   ✅ Academic periods deleted');

    // Users (preserve admin and users referenced by preserved teachers)
    console.log('📝 Deleting users (preserving admin and users for preserved teachers)...');
    const adminUser = await prisma.users.findUnique({
      where: { username: 'admin' },
    });

    // Get user IDs for preserved teachers
    const preservedTeachers = await prisma.teachers.findMany({
      where: {
        id: {
          in: teacherIdsInUse,
        },
      },
      select: { userId: true },
    });
    const preservedUserIds = preservedTeachers.map(t => t.userId);
    if (adminUser) {
      preservedUserIds.push(adminUser.id);
    }

    if (preservedUserIds.length > 0) {
      await prisma.users.deleteMany({
        where: {
          id: {
            notIn: preservedUserIds,
          },
        },
      });
      console.log(`   ✅ Unused users deleted (${preservedUserIds.length} users preserved)`);
    } else {
      await prisma.users.deleteMany({});
      console.log('   ✅ All users deleted');
    }

    console.log('\n✅ Database purge completed!\n');
    console.log('📋 Preserved:');
    console.log('   ✓ Subjects (subjects)');
    console.log('   ✓ Groups (groups)');
    console.log('   ✓ Diagnostic Exam Periods (diagnostic_exam_periods)\n');
  } catch (error: any) {
    console.error('❌ Error purging database:', error.message);
    throw error;
  }
}

async function createAdmin() {
  console.log('👤 Creating admin user...');
  
  const existingAdmin = await prisma.users.findUnique({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('   ℹ️  Admin user already exists, skipping creation');
    return existingAdmin;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminId = randomUUID();

  const admin = await prisma.users.create({
    data: {
      id: adminId,
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      email: 'admin@example.com',
      telefono: '5500000000',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  });

  console.log('   ✅ Admin created');
  console.log('      Username: admin');
  console.log('      Password: admin123');
  console.log('      Email: admin@example.com\n');
  
  return admin;
}

async function createTeacher() {
  console.log('👨‍🏫 Creating teacher user...');

  // Check if teacher1 already exists
  const existingTeacherUser = await prisma.users.findUnique({
    where: { username: 'teacher1' },
  });

  if (existingTeacherUser) {
    const existingTeacher = await prisma.teachers.findFirst({
      where: { userId: existingTeacherUser.id },
    });
    if (existingTeacher) {
      console.log('   ℹ️  Teacher user already exists, skipping creation');
      console.log('      Username: teacher1');
      console.log('      Password: password123');
      console.log('      Name: ' + (existingTeacher.nombre + ' ' + existingTeacher.apellidoPaterno + ' ' + existingTeacher.apellidoMaterno) + '\n');
      return { user: existingTeacherUser, teacher: existingTeacher };
    }
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const teacherUserId = randomUUID();
  const teacherId = randomUUID();

  // Create or get a career first
  let career = await prisma.careers.findFirst({
    where: { codigo: 'IS' },
  });

  if (!career) {
    career = await prisma.careers.create({
      data: {
        id: randomUUID(),
        codigo: 'IS',
        nombre: 'Ingeniería en Sistemas',
        area: 'Ingeniería',
        duracionSemestres: 10,
        estatus: 'ACTIVA',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });
  }

  // Create user
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

  // Create teacher
  const teacher = await prisma.teachers.create({
    data: {
      id: teacherId,
      userId: teacherUser.id,
      nombre: 'Test',
      apellidoPaterno: 'Teacher',
      apellidoMaterno: 'Uno',
      departamento: 'Ciencias Básicas',
      email: teacherUser.email,
      telefono: teacherUser.telefono,
      gradoAcademico: 'Maestría',
      especialidad: 'Ingeniería de Software',
      cedulaProfesional: 'TCH00001',
      universidad: 'UNAM',
      tipoContrato: 'TIEMPO_COMPLETO',
      estatus: 'ACTIVO',
      salario: 30000,
      fechaContratacion: new Date(),
      genero: 'MASCULINO',
      nacionalidad: 'Mexicana',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      pais: 'México',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  });

  console.log('   ✅ Teacher created');
  console.log('      Username: teacher1');
  console.log('      Password: password123');
  console.log('      Email: teacher1@example.com');
  console.log('      Name: Test Teacher Uno\n');

  return { user: teacherUser, teacher };
}

async function createStudents(count: number = 10) {
  console.log(`👨‍🎓 Creating ${count} student users...\n`);

  // Get or create a career
  let career = await prisma.careers.findFirst({
    where: { codigo: 'IS' },
  });

  if (!career) {
    career = await prisma.careers.create({
      data: {
        id: randomUUID(),
        codigo: 'IS',
        nombre: 'Ingeniería en Sistemas',
        area: 'Ingeniería',
        duracionSemestres: 10,
        estatus: 'ACTIVA',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const currentYear = new Date().getFullYear();
  const createdStudents: Array<{ username: string; matricula: string; nombre: string }> = [];

  for (let i = 1; i <= count; i++) {
    const username = `student${i}`;
    
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log(`   ⚠️  User "${username}" already exists. Skipping creation.`);
      const existingStudent = await prisma.students.findFirst({
        where: { userId: existingUser.id },
      });
      if (existingStudent) {
        createdStudents.push({
          username,
          matricula: existingStudent.matricula,
          nombre: `${existingStudent.nombre} ${existingStudent.apellidoPaterno} ${existingStudent.apellidoMaterno}`,
        });
      }
      continue;
    }

    try {
      // Create user and student in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const studentUserId = randomUUID();
        const studentUser = await tx.users.create({
          data: {
            id: studentUserId,
            username,
            passwordHash,
            role: 'STUDENT',
            email: `${username}@example.com`,
            telefono: `550000000${i}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
        });

        // Generate matricula
        const matriculaCount = await tx.students.count({
          where: {
            matricula: {
              startsWith: `${currentYear}-`,
            },
          },
        });
        const matricula = `${currentYear}-${String(matriculaCount + 1).padStart(6, '0')}`;

        // Create student record
        const studentId = randomUUID();
        const student = await tx.students.create({
          data: {
            id: studentId,
            userId: studentUser.id,
            matricula,
            nombre: 'Test',
            apellidoPaterno: 'Student',
            apellidoMaterno: i === 1 ? 'Uno' : i === 2 ? 'Dos' : i === 3 ? 'Tres' : i === 4 ? 'Cuatro' : i === 5 ? 'Cinco' : i === 6 ? 'Seis' : i === 7 ? 'Siete' : i === 8 ? 'Ocho' : i === 9 ? 'Nueve' : 'Diez',
            carrera: career.nombre,
            carreraId: career.id,
            semestre: 1,
            estatus: 'ACTIVO',
            curp: `TST${String(i).padStart(2, '0')}000000HDFRL${String(i).padStart(2, '0')}`,
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

        return { user: studentUser, student };
      });

      console.log(`   ✅ ${username} created successfully!`);
      createdStudents.push({
        username,
        matricula: result.student.matricula,
        nombre: `${result.student.nombre} ${result.student.apellidoPaterno} ${result.student.apellidoMaterno}`,
      });
    } catch (error: any) {
      console.error(`   ❌ Error creating ${username}:`, error.message);
    }
  }

  console.log(`\n✅ All students processed!\n`);
  console.log('📋 Credenciales:');
  console.log('   👤 ADMIN:');
  console.log('      Username: admin');
  console.log('      Password: admin123\n');
  console.log('   👨‍🏫 TEACHER:');
  console.log('      Username: teacher1');
  console.log('      Password: password123\n');
  console.log('   👨‍🎓 STUDENTS:');
  createdStudents.forEach((student) => {
    console.log(`      ${student.username.toUpperCase()}:`);
    console.log(`         Username: ${student.username}`);
    console.log(`         Password: password123`);
    console.log(`         Matrícula: ${student.matricula}`);
    console.log(`         Nombre: ${student.nombre}`);
    console.log('');
  });
}

async function main() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     🔄 PURGE AND CREATE MINIMAL TEST DATA                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Step 1: Purge database
    await purgeDatabase();

    // Step 2: Create admin
    await createAdmin();

    // Step 3: Create teacher
    await createTeacher();

    // Step 4: Create students
    await createStudents(10);

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ ALL OPERATIONS COMPLETED SUCCESSFULLY                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


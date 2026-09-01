#!/usr/bin/env ts-node
/**
 * Script to create student2 user
 * 
 * Creates a second student user for testing purposes
 * 
 * Usage: npx ts-node scripts/create-student2.ts
 */

import { createPrismaClient } from '../src/config/create-prisma-client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();
const prisma = createPrismaClient();

async function createStudent2() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     👨‍🎓 CREATING STUDENT2                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Check if student2 already exists
  const existingUser = await prisma.users.findUnique({
    where: { username: 'student2' },
  });

  if (existingUser) {
    console.log('⚠️  User "student2" already exists. Skipping creation.');
    const existingStudent = await prisma.students.findFirst({
      where: { userId: existingUser.id },
    });
    if (existingStudent) {
      console.log(`   Student ID: ${existingStudent.id}`);
      console.log(`   Matrícula: ${existingStudent.matricula}`);
      console.log(`   Nombre: ${existingStudent.nombre} ${existingStudent.apellidoPaterno} ${existingStudent.apellidoMaterno}`);
    }
    await prisma.$disconnect();
    return;
  }

  // Get or create a career (use the same as student1 or first available)
  let career = await prisma.careers.findFirst({
    where: { codigo: 'IS' },
  });

  if (!career) {
    // If no IS career, get the first available
    career = await prisma.careers.findFirst();
    
    if (!career) {
      // Create a default career if none exists
      console.log('📚 Creating default career...');
      const careerId = randomUUID();
      career = await prisma.careers.create({
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
    }
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create user and student in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const studentUserId = randomUUID();
    const studentUser = await tx.users.create({
      data: {
        id: studentUserId,
        username: 'student2',
        passwordHash,
        role: 'STUDENT',
        email: 'student2@example.com',
        telefono: '5500000003',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });

    // Generate matricula
    const currentYear = new Date().getFullYear();
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
        apellidoMaterno: 'Dos',
        carrera: career.nombre,
        carreraId: career.id,
        semestre: 1,
        estatus: 'ACTIVO',
        curp: 'TSTD000000HDFRLS02',
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

  console.log('✅ Student2 created successfully!\n');
  console.log('📋 Credenciales:');
  console.log('   👨‍🎓 STUDENT2:');
  console.log('      Username: student2');
  console.log('      Password: password123');
  console.log('      Email: student2@example.com');
  console.log('      Matrícula: ' + result.student.matricula);
  console.log('      Nombre: ' + result.student.nombre + ' ' + result.student.apellidoPaterno + ' ' + result.student.apellidoMaterno);
  console.log('      Carrera: ' + result.student.carrera);
  console.log('      Semestre: ' + result.student.semestre);
  console.log('');
}

async function main() {
  try {
    await createStudent2();
  } catch (error) {
    console.error('❌ Error creating student2:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



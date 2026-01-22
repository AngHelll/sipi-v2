#!/usr/bin/env ts-node
/**
 * Script to create student3, student4, and student5 users
 * 
 * Creates three additional student users for testing purposes
 * 
 * Usage: npx ts-node scripts/create-students-3-4-5.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();
const prisma = new PrismaClient();

interface StudentData {
  username: string;
  email: string;
  telefono: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
}

const studentsData: StudentData[] = [
  {
    username: 'student3',
    email: 'student3@example.com',
    telefono: '5500000004',
    nombre: 'Test',
    apellidoPaterno: 'Student',
    apellidoMaterno: 'Tres',
    curp: 'TSTT000000HDFRLS03',
  },
  {
    username: 'student4',
    email: 'student4@example.com',
    telefono: '5500000005',
    nombre: 'Test',
    apellidoPaterno: 'Student',
    apellidoMaterno: 'Cuatro',
    curp: 'TSTC000000HDFRLS04',
  },
  {
    username: 'student5',
    email: 'student5@example.com',
    telefono: '5500000006',
    nombre: 'Test',
    apellidoPaterno: 'Student',
    apellidoMaterno: 'Cinco',
    curp: 'TSTC000000HDFRLS05',
  },
];

async function createStudents() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     👨‍🎓 CREATING STUDENTS 3, 4, AND 5                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

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
  const currentYear = new Date().getFullYear();
  const createdStudents: Array<{ username: string; matricula: string; nombre: string }> = [];

  for (const studentData of studentsData) {
    // Check if student already exists
    const existingUser = await prisma.users.findUnique({
      where: { username: studentData.username },
    });

    if (existingUser) {
      console.log(`⚠️  User "${studentData.username}" already exists. Skipping creation.`);
      const existingStudent = await prisma.students.findFirst({
        where: { userId: existingUser.id },
      });
      if (existingStudent) {
        console.log(`   Student ID: ${existingStudent.id}`);
        console.log(`   Matrícula: ${existingStudent.matricula}`);
        console.log(`   Nombre: ${existingStudent.nombre} ${existingStudent.apellidoPaterno} ${existingStudent.apellidoMaterno}`);
        createdStudents.push({
          username: studentData.username,
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
            username: studentData.username,
            passwordHash,
            role: 'STUDENT',
            email: studentData.email,
            telefono: studentData.telefono,
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
            nombre: studentData.nombre,
            apellidoPaterno: studentData.apellidoPaterno,
            apellidoMaterno: studentData.apellidoMaterno,
            carrera: career.nombre,
            carreraId: career.id,
            semestre: 1,
            estatus: 'ACTIVO',
            curp: studentData.curp,
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

      console.log(`✅ ${studentData.username} created successfully!`);
      createdStudents.push({
        username: studentData.username,
        matricula: result.student.matricula,
        nombre: `${result.student.nombre} ${result.student.apellidoPaterno} ${result.student.apellidoMaterno}`,
      });
    } catch (error) {
      console.error(`❌ Error creating ${studentData.username}:`, error);
    }
  }

  console.log('\n✅ All students processed!\n');
  console.log('📋 Credenciales:');
  createdStudents.forEach((student) => {
    console.log(`   👨‍🎓 ${student.username.toUpperCase()}:`);
    console.log(`      Username: ${student.username}`);
    console.log(`      Password: password123`);
    console.log(`      Email: ${student.username}@example.com`);
    console.log(`      Matrícula: ${student.matricula}`);
    console.log(`      Nombre: ${student.nombre}`);
    console.log(`      Carrera: ${career.nombre}`);
    console.log(`      Semestre: 1`);
    console.log('');
  });
}

async function main() {
  try {
    await createStudents();
  } catch (error) {
    console.error('❌ Error creating students:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



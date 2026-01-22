#!/usr/bin/env ts-node
/**
 * Script to create student6, student7, student8, student9, and student19 users
 * 
 * Creates five additional student users for testing purposes
 * 
 * Usage: npx ts-node scripts/create-students-6-7-8-9-19.ts
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
    username: 'student6',
    email: 'student6@example.com',
    telefono: '5500000007',
    nombre: 'Test',
    apellidoPaterno: 'Student',
    apellidoMaterno: 'Seis',
    curp: 'TSTS000000HDFRLS06',
  },
  {
    username: 'student7',
    email: 'student7@example.com',
    telefono: '5500000008',
    nombre: 'Test',
    apellidoPaterno: 'Student',
    apellidoMaterno: 'Siete',
    curp: 'TSTV000000HDFRLS07',
  },
  {
    username: 'student8',
    email: 'student8@example.com',
    telefono: '5500000009',
    nombre: 'Test',
    apellidoPaterno: 'Student',
    apellidoMaterno: 'Ocho',
    curp: 'TSTO000000HDFRLS08',
  },
  {
    username: 'student9',
    email: 'student9@example.com',
    telefono: '5500000010',
    nombre: 'Test',
    apellidoPaterno: 'Student',
    apellidoMaterno: 'Nueve',
    curp: 'TSTN000000HDFRLS09',
  },
  {
    username: 'student19',
    email: 'student19@example.com',
    telefono: '5500000020',
    nombre: 'Test',
    apellidoPaterno: 'Student',
    apellidoMaterno: 'Diecinueve',
    curp: 'TSTD000000HDFRLS19',
  },
];

async function createStudents() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     👨‍🎓 CREATING STUDENTS 6, 7, 8, 9, AND 19              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

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



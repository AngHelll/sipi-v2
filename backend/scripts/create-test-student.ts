// Script to create a test student user
import { createPrismaClient } from '../src/config/create-prisma-client';
import { UserRole } from '../src/db/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = createPrismaClient();

async function createTestStudent() {
  const username = 'student';
  const password = 'student123';
  const role = UserRole.STUDENT;

  console.log('🔧 Creating test student user...\n');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { username } });

  if (existingUser) {
    console.log(`⚠️ User '${username}' already exists. Skipping creation.`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user and student in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });

    // Generate unique matricula
    const timestamp = Date.now();
    const matricula = `2024${timestamp.toString().slice(-3)}`;

    // Create student record
    const student = await tx.student.create({
      data: {
        userId: user.id,
        matricula,
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'López',
        carrera: 'Ingeniería Industrial',
        semestre: 5,
        estatus: 'ACTIVO',
      },
    });

    return { user, student };
  });

  console.log(`✅ Test student user created successfully!`);
  console.log(`   Username: ${result.user.username}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ${result.user.role}`);
  console.log(`   Student ID: ${result.student.id}`);
  console.log(`   Matrícula: ${result.student.matricula}`);
  console.log(`   Name: ${result.student.nombre} ${result.student.apellidoPaterno} ${result.student.apellidoMaterno}`);
  console.log(`   Carrera: ${result.student.carrera}`);
  console.log(`   Semestre: ${result.student.semestre}`);
  console.log(`   Estatus: ${result.student.estatus}\n`);
}

createTestStudent()
  .catch((e) => {
    console.error('❌ Error creating test student:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


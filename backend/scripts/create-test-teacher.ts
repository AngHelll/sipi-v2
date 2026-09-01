// Script to create a test teacher user
import { createPrismaClient } from '../src/config/create-prisma-client';
import { UserRole } from '../src/db/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = createPrismaClient();

async function createTestTeacher() {
  const username = 'teacher';
  const password = 'teacher123';
  const role = UserRole.TEACHER;

  console.log('🔧 Creating test teacher user...\n');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { username } });

  if (existingUser) {
    console.log(`⚠️ User '${username}' already exists. Skipping creation.`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user and teacher in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });

    // Create teacher record
    const teacher = await tx.teacher.create({
      data: {
        userId: user.id,
        nombre: 'Carlos',
        apellidoPaterno: 'García',
        apellidoMaterno: 'Martínez',
        departamento: 'Ingeniería Industrial',
      },
    });

    return { user, teacher };
  });

  console.log(`✅ Test teacher user created successfully!`);
  console.log(`   Username: ${result.user.username}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ${result.user.role}`);
  console.log(`   Teacher ID: ${result.teacher.id}`);
  console.log(`   Name: ${result.teacher.nombre} ${result.teacher.apellidoPaterno} ${result.teacher.apellidoMaterno}`);
  console.log(`   Departamento: ${result.teacher.departamento}\n`);
}

createTestTeacher()
  .catch((e) => {
    console.error('❌ Error creating test teacher:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


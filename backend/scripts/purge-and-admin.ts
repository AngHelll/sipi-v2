#!/usr/bin/env ts-node
/**
 * Purga completa de la BD local y crea un único usuario admin.
 * Uso: npm run reset:admin
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();
const prisma = new PrismaClient();

const ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

async function purgeAll(): Promise<void> {
  console.log('\n🧹 Purga completa (SIPI Inglés + SIS)...\n');

  await prisma.activity_history.deleteMany({});
  await prisma.enrollments_v2.deleteMany({});
  await prisma.exams.deleteMany({});
  await prisma.special_courses.deleteMany({});
  await prisma.social_service.deleteMany({});
  await prisma.professional_practices.deleteMany({});
  await prisma.academic_activities.deleteMany({});
  await prisma.diagnostic_exam_periods.deleteMany({});

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
  await prisma.users.deleteMany({});

  console.log('✅ Todas las tablas vaciadas.\n');
}

async function ensureAdmin(): Promise<void> {
  console.log('👤 Creando usuario admin...\n');

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const now = new Date();

  await prisma.users.create({
    data: {
      id: randomUUID(),
      username: ADMIN_USERNAME,
      passwordHash,
      role: 'ADMIN',
      email: 'admin@sipi.local',
      updatedAt: now,
    },
  });

  console.log('✅ Admin listo:\n');
  console.log(`   Username: ${ADMIN_USERNAME}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('   Role:     ADMIN\n');
}

async function main(): Promise<void> {
  try {
    await purgeAll();
    await ensureAdmin();
    console.log('💡 Siguiente paso: npm run seed:careers\n');
    console.log('   Luego inicia sesión en http://localhost:5173\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

// Script to create test groups
import { createPrismaClient } from '../src/config/create-prisma-client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = createPrismaClient();

async function createTestGroups() {
  console.log('🔧 Creating test groups...\n');

  try {
    // Get first subject
    const subject = await prisma.subject.findFirst();
    if (!subject) {
      console.log('⚠️ No subjects found. Please create subjects first.');
      return;
    }

    // Get first teacher
    const teacher = await prisma.teacher.findFirst();
    if (!teacher) {
      console.log('⚠️ No teachers found. Please create teachers first.');
      return;
    }

    console.log(`📚 Using Subject: ${subject.nombre} (${subject.clave})`);
    console.log(`👨‍🏫 Using Teacher: ${teacher.nombre} ${teacher.apellidoPaterno}\n`);

    // Create groups
    const groups = [
      {
        subjectId: subject.id,
        teacherId: teacher.id,
        nombre: 'Grupo A',
        periodo: '2024-1',
      },
      {
        subjectId: subject.id,
        teacherId: teacher.id,
        nombre: 'Grupo B',
        periodo: '2024-2',
      },
    ];

    for (const groupData of groups) {
      const existing = await prisma.group.findFirst({
        where: {
          nombre: groupData.nombre,
          periodo: groupData.periodo,
          subjectId: groupData.subjectId,
        },
      });

      if (existing) {
        console.log(`⚠️ Group '${groupData.nombre}' (${groupData.periodo}) already exists. Skipping.`);
        continue;
      }

      const group = await prisma.group.create({
        data: groupData,
      });

      console.log(`✅ Group '${group.nombre}' (${group.periodo}) created!`);
      console.log(`   ID: ${group.id}\n`);
    }
  } catch (error) {
    console.error('❌ Error creating groups:', error);
    throw error;
  }
}

createTestGroups()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


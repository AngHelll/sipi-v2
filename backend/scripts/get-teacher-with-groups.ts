// Script to get a teacher with groups
import { createPrismaClient } from '../src/config/create-prisma-client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = createPrismaClient();

async function getTeacherWithGroups() {
  console.log('🔍 Searching for teacher with groups...\n');

  try {
    // Find a teacher with groups
    const teacher = await prisma.teachers.findFirst({
      where: {
        groups: {
          some: {}
        }
      },
      include: {
        users: {
          select: {
            username: true,
            email: true,
            role: true
          }
        },
        groups: {
          include: {
            subjects: {
              select: {
                clave: true,
                nombre: true,
                creditos: true
              }
            },
            enrollments: {
              select: {
                id: true
              }
            }
          },
          orderBy: {
            periodo: 'desc'
          }
        }
      }
    });

    if (!teacher) {
      console.log('⚠️ No teacher with groups found.');
      console.log('💡 Run create-test-teacher.ts and create-test-groups.ts to create test data.\n');
      return;
    }

    console.log('✅ Teacher found with groups!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('👨‍🏫 TEACHER INFORMATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📧 Username: ${teacher.users.username}`);
    console.log(`📧 Email: ${teacher.users.email || 'N/A'}`);
    console.log(`👤 Name: ${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`);
    console.log(`🏢 Department: ${teacher.departamento}`);
    console.log(`📊 Groups assigned: ${teacher.groups.length}`);
    console.log(`📊 Total students: ${teacher.estudiantesTotal}`);
    console.log(`\n`);

    if (teacher.groups.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📚 GROUPS');
      console.log('═══════════════════════════════════════════════════════════');
      
      teacher.groups.forEach((group, index) => {
        console.log(`\n${index + 1}. ${group.nombre} (${group.periodo})`);
        console.log(`   ID: ${group.id}`);
        console.log(`   Code: ${group.codigo}`);
        console.log(`   Subject: ${group.subjects.clave} - ${group.subjects.nombre} (${group.subjects.creditos} credits)`);
        console.log(`   Status: ${group.estatus}`);
        console.log(`   Capacity: ${group.cupoActual}/${group.cupoMaximo} (min: ${group.cupoMinimo})`);
        console.log(`   Modality: ${group.modalidad}`);
        console.log(`   Enrollments: ${group.enrollments.length}`);
        if (group.horario) console.log(`   Schedule: ${group.horario}`);
        if (group.aula) console.log(`   Classroom: ${group.aula}`);
        if (group.edificio) console.log(`   Building: ${group.edificio}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💡 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Username: ${teacher.users.username}`);
    console.log(`Password: (check create-test-teacher.ts or database)`);
    console.log(`Role: ${teacher.users.role}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

getTeacherWithGroups()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

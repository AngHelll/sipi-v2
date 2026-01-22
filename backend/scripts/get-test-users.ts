// Script to get test users (student and teacher) with their credentials
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getTestUsers() {
  try {
    // Get a student user
    const student = await prisma.students.findFirst({
      where: {
        deletedAt: null,
      },
      include: {
        users: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    // Get a teacher user
    const teacher = await prisma.teachers.findFirst({
      where: {
        deletedAt: null,
      },
      include: {
        users: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     👤 USUARIOS DE PRUEBA                                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    if (student) {
      console.log('📚 ESTUDIANTE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Nombre: ${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno}`);
      console.log(`   Matrícula: ${student.matricula}`);
      console.log(`   Username: ${student.users?.username || 'N/A'}`);
      console.log(`   Email: ${student.users?.email || student.email || 'N/A'}`);
      console.log(`   Carrera: ${student.carrera}`);
      console.log(`   Semestre: ${student.semestre}`);
      console.log(`   Estatus: ${student.estatus}`);
      console.log(`   Password: password123`);
      console.log('');
    } else {
      console.log('❌ No se encontraron estudiantes');
    }

    if (teacher) {
      console.log('👨‍🏫 PROFESOR:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Nombre: ${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`);
      console.log(`   Username: ${teacher.users?.username || 'N/A'}`);
      console.log(`   Email: ${teacher.users?.email || teacher.email || 'N/A'}`);
      console.log(`   Departamento: ${teacher.departamento}`);
      console.log(`   Estatus: ${teacher.estatus || 'N/A'}`);
      console.log(`   Password: password123`);
      console.log('');
    } else {
      console.log('❌ No se encontraron profesores');
    }

    console.log('💡 Nota: La contraseña por defecto para todos los usuarios es: password123\n');

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTestUsers();






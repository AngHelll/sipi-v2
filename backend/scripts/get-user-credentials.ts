import { createPrismaClient } from '../src/config/create-prisma-client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = createPrismaClient();

async function getUserCredentials() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🔑 CREDENCIALES DE USUARIOS                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get admin user
  const adminUser = await prisma.users.findFirst({
    where: { role: 'ADMIN' },
  });

  if (adminUser) {
    console.log('👨‍💼 USUARIO ADMIN:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email || 'N/A'}`);
    console.log(`   Password: password123 (default)`);
    console.log(`   Role: ${adminUser.role}\n`);
  }

  // Get teacher user with teacher info
  const teacherUser = await prisma.users.findFirst({
    where: { role: 'TEACHER' },
    include: {
      teachers: {
        include: {
          groups: {
            include: {
              subjects: true,
            },
          },
        },
      },
    },
  });

  if (teacherUser && teacherUser.teachers) {
    const teacher = teacherUser.teachers;
    console.log('👨‍🏫 USUARIO MAESTRO:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Username: ${teacherUser.username}`);
    console.log(`   Email: ${teacherUser.email || 'N/A'}`);
    console.log(`   Password: password123 (default)`);
    console.log(`   Role: ${teacherUser.role}`);
    console.log(`   Nombre: ${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`);
    console.log(`   Departamento: ${teacher.departamento}`);
    console.log(`   Grupos asignados: ${teacher.groups.length}`);
    if (teacher.groups.length > 0) {
      console.log(`   Grupos:`);
      teacher.groups.slice(0, 3).forEach((group, idx) => {
        console.log(`      ${idx + 1}. ${group.subjects.clave} - ${group.subjects.nombre} (${group.periodo})`);
      });
      if (teacher.groups.length > 3) {
        console.log(`      ... y ${teacher.groups.length - 3} más`);
      }
    }
    console.log('');
  }

  // Get student user with student info
  const studentUser = await prisma.users.findFirst({
    where: { role: 'STUDENT' },
    include: {
      students: {
        include: {
          enrollments: {
            where: { deletedAt: null },
            include: {
              groups: {
                include: {
                  subjects: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (studentUser && studentUser.students) {
    const student = studentUser.students;
    console.log('👨‍🎓 USUARIO ALUMNO:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Username: ${studentUser.username}`);
    console.log(`   Email: ${studentUser.email || student.email || 'N/A'}`);
    console.log(`   Password: password123 (default)`);
    console.log(`   Role: ${studentUser.role}`);
    console.log(`   Matrícula: ${student.matricula}`);
    console.log(`   Nombre: ${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno}`);
    console.log(`   Carrera: ${student.carrera}`);
    console.log(`   Semestre: ${student.semestre}`);
    console.log(`   Estatus: ${student.estatus}`);
    if (student.promedioGeneral !== null) {
      console.log(`   Promedio General: ${Number(student.promedioGeneral).toFixed(2)}`);
    }
    if (student.promedioIngles !== null) {
      console.log(`   Promedio Inglés: ${Number(student.promedioIngles).toFixed(2)}`);
    }
    console.log(`   Inscripciones: ${student.enrollments.length}`);
    if (student.enrollments.length > 0) {
      console.log(`   Materias inscritas:`);
      student.enrollments.slice(0, 5).forEach((enrollment, idx) => {
        const subject = enrollment.groups.subjects;
        const grade = enrollment.calificacionFinal || enrollment.calificacion;
        console.log(`      ${idx + 1}. ${subject.clave} - ${subject.nombre} ${grade ? `(${grade})` : '(Sin calificar)'}`);
      });
      if (student.enrollments.length > 5) {
        console.log(`      ... y ${student.enrollments.length - 5} más`);
      }
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('💡 NOTA: La contraseña por defecto para todos los usuarios');
  console.log('   creados por el script es: password123\n');
}

getUserCredentials()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

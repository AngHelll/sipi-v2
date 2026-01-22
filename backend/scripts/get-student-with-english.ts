import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function getStudentWithEnglish() {
  // Get student with English average
  const studentWithEnglish = await prisma.students.findFirst({
    where: {
      promedioIngles: { not: null },
    },
    include: {
      users: {
        select: {
          username: true,
          email: true,
          role: true,
        },
      },
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
  });

  if (studentWithEnglish) {
    console.log('\n👨‍🎓 USUARIO ALUMNO (con promedio de inglés):');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Username: ${studentWithEnglish.users.username}`);
    console.log(`   Email: ${studentWithEnglish.users.email || studentWithEnglish.email || 'N/A'}`);
    console.log(`   Password: password123 (default)`);
    console.log(`   Role: ${studentWithEnglish.users.role}`);
    console.log(`   Matrícula: ${studentWithEnglish.matricula}`);
    console.log(`   Nombre: ${studentWithEnglish.nombre} ${studentWithEnglish.apellidoPaterno} ${studentWithEnglish.apellidoMaterno}`);
    console.log(`   Carrera: ${studentWithEnglish.carrera}`);
    console.log(`   Semestre: ${studentWithEnglish.semestre}`);
    console.log(`   Estatus: ${studentWithEnglish.estatus}`);
    if (studentWithEnglish.promedioGeneral !== null) {
      console.log(`   📊 Promedio General: ${Number(studentWithEnglish.promedioGeneral).toFixed(2)}`);
    }
    if (studentWithEnglish.promedioIngles !== null) {
      console.log(`   🇬🇧 Promedio Inglés: ${Number(studentWithEnglish.promedioIngles).toFixed(2)}`);
    }
    console.log(`   Inscripciones: ${studentWithEnglish.enrollments.length}`);
    
    // Separate English and non-English enrollments
    const englishEnrollments = studentWithEnglish.enrollments.filter(e => {
      const clave = e.groups.subjects.clave?.toUpperCase() || '';
      const nombre = e.groups.subjects.nombre?.toLowerCase() || '';
      return clave.startsWith('ING-') || clave.startsWith('LE-') || 
             nombre.includes('inglés') || nombre.includes('ingles') || nombre.includes('english');
    });
    
    const regularEnrollments = studentWithEnglish.enrollments.filter(e => !englishEnrollments.includes(e));
    
    if (englishEnrollments.length > 0) {
      console.log(`\n   🇬🇧 Materias de Inglés (${englishEnrollments.length}):`);
      englishEnrollments.forEach((enrollment, idx) => {
        const subject = enrollment.groups.subjects;
        const grade = enrollment.calificacionFinal || enrollment.calificacion;
        console.log(`      ${idx + 1}. ${subject.clave} - ${subject.nombre} ${grade ? `(${grade})` : '(Sin calificar)'}`);
      });
    }
    
    if (regularEnrollments.length > 0) {
      console.log(`\n   📚 Otras Materias (${regularEnrollments.length}):`);
      regularEnrollments.slice(0, 5).forEach((enrollment, idx) => {
        const subject = enrollment.groups.subjects;
        const grade = enrollment.calificacionFinal || enrollment.calificacion;
        console.log(`      ${idx + 1}. ${subject.clave} - ${subject.nombre} ${grade ? `(${grade})` : '(Sin calificar)'}`);
      });
      if (regularEnrollments.length > 5) {
        console.log(`      ... y ${regularEnrollments.length - 5} más`);
      }
    }
    console.log('');
  } else {
    console.log('⚠️  No se encontró un estudiante con promedio de inglés calculado.');
  }
}

getStudentWithEnglish()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

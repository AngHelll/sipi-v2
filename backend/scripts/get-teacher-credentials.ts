// Script to get teacher credentials
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function getTeacherCredentials() {
  console.log('🔍 Getting teacher credentials...\n');

  try {
    // Find teacher by username
    const user = await prisma.users.findUnique({
      where: { username: 'prof.gonzález3' },
      include: {
        teachers: {
          include: {
            groups: {
              include: {
                subjects: true,
                enrollments: {
                  include: {
                    students: {
                      select: {
                        matricula: true,
                        nombre: true,
                        apellidoPaterno: true,
                        apellidoMaterno: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.teachers) {
      console.log('⚠️ Teacher not found.');
      return;
    }

    const teacher = user.teachers;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('👨‍🏫 USUARIO MAESTRO CON GRUPOS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n📧 Username: ${user.username}`);
    console.log(`📧 Email: ${user.email || 'N/A'}`);
    console.log(`🔑 Password: (verificar en base de datos o scripts)`);
    console.log(`👤 Nombre: ${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`);
    console.log(`🏢 Departamento: ${teacher.departamento}`);
    console.log(`📊 Total de grupos: ${teacher.groups.length}`);
    console.log(`📊 Total de estudiantes: ${teacher.estudiantesTotal}`);
    console.log(`\n`);

    if (teacher.groups.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📚 GRUPOS ASIGNADOS');
      console.log('═══════════════════════════════════════════════════════════');
      
      teacher.groups.forEach((group, index) => {
        console.log(`\n${index + 1}. ${group.nombre} (${group.periodo})`);
        console.log(`   📋 Código: ${group.codigo}`);
        console.log(`   📚 Materia: ${group.subjects.clave} - ${group.subjects.nombre}`);
        console.log(`   📊 Créditos: ${group.subjects.creditos}`);
        console.log(`   ✅ Estatus: ${group.estatus}`);
        console.log(`   👥 Capacidad: ${group.cupoActual}/${group.cupoMaximo} (mín: ${group.cupoMinimo})`);
        console.log(`   🎓 Modalidad: ${group.modalidad}`);
        console.log(`   📝 Inscripciones: ${group.enrollments.length}`);
        
        if (group.enrollments.length > 0) {
          console.log(`   👨‍🎓 Estudiantes inscritos:`);
          group.enrollments.forEach((enrollment, idx) => {
            const student = enrollment.students;
            console.log(`      ${idx + 1}. ${student.matricula} - ${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno}`);
          });
        }
        
        if (group.horario) console.log(`   ⏰ Horario: ${group.horario}`);
        if (group.aula) console.log(`   🏛️ Aula: ${group.aula}`);
        if (group.edificio) console.log(`   🏢 Edificio: ${group.edificio}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💡 INFORMACIÓN DE ACCESO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`\n💡 Nota: La contraseña debe verificarse en la base de datos`);
    console.log(`   o en los scripts de creación (create-test-teacher.ts)`);
    console.log(`   Por defecto suele ser: "teacher123" o similar\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

getTeacherCredentials()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

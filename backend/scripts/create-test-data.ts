// Script to create test data (subject, group, enrollment)
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function createTestData() {
  console.log('🔧 Creating test data...\n');

  try {
    // Find test teacher
    const teacherUser = await prisma.user.findUnique({
      where: { username: 'teacher' },
      include: { teacher: true },
    });

    if (!teacherUser || !teacherUser.teacher) {
      console.log('⚠️ Teacher user not found. Please run create-test-teacher.ts first.');
      return;
    }

    // Find test student
    const studentUser = await prisma.user.findUnique({
      where: { username: 'student' },
      include: { student: true },
    });

    if (!studentUser || !studentUser.student) {
      console.log('⚠️ Student user not found. Please run create-test-student.ts first.');
      return;
    }

    console.log(`✅ Found teacher: ${teacherUser.teacher.nombre} ${teacherUser.teacher.apellidoPaterno}`);
    console.log(`✅ Found student: ${studentUser.student.nombre} ${studentUser.student.apellidoPaterno} (${studentUser.student.matricula})\n`);

    // Create or find subject
    let subject = await prisma.subject.findUnique({
      where: { clave: 'IS-101' },
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          clave: 'IS-101',
          nombre: 'Programación I',
          creditos: 6,
        },
      });
      console.log(`✅ Created subject: ${subject.clave} - ${subject.nombre}`);
    } else {
      console.log(`✅ Found subject: ${subject.clave} - ${subject.nombre}`);
    }

    // Create or find group
    let group = await prisma.group.findFirst({
      where: {
        subjectId: subject.id,
        teacherId: teacherUser.teacher.id,
        nombre: 'Grupo A',
        periodo: '2024-1',
      },
    });

    if (!group) {
      group = await prisma.group.create({
        data: {
          subjectId: subject.id,
          teacherId: teacherUser.teacher.id,
          nombre: 'Grupo A',
          periodo: '2024-1',
        },
      });
      console.log(`✅ Created group: ${group.nombre} - ${group.periodo}`);
    } else {
      console.log(`✅ Found group: ${group.nombre} - ${group.periodo}`);
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_groupId: {
          studentId: studentUser.student.id,
          groupId: group.id,
        },
      },
    });

    if (existingEnrollment) {
      console.log(`⚠️ Enrollment already exists for student ${studentUser.student.matricula} in group ${group.nombre}`);
      console.log(`   Enrollment ID: ${existingEnrollment.id}`);
      if (existingEnrollment.calificacion !== null) {
        console.log(`   Current grade: ${existingEnrollment.calificacion}`);
      }
    } else {
      // Create enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: studentUser.student.id,
          groupId: group.id,
          calificacion: null, // No grade yet, teacher will assign it
        },
      });
      console.log(`✅ Created enrollment: Student ${studentUser.student.matricula} enrolled in ${group.nombre}`);
    }

    // Create additional groups for more testing
    const additionalGroups = [
      {
        nombre: 'Grupo B',
        periodo: '2024-1',
        subjectClave: 'IS-102',
        subjectNombre: 'Estructuras de Datos',
        creditos: 6,
      },
      {
        nombre: 'Grupo C',
        periodo: '2024-2',
        subjectClave: 'IS-201',
        subjectNombre: 'Programación II',
        creditos: 6,
      },
    ];

    for (const groupData of additionalGroups) {
      // Create or find subject
      let additionalSubject = await prisma.subject.findUnique({
        where: { clave: groupData.subjectClave },
      });

      if (!additionalSubject) {
        additionalSubject = await prisma.subject.create({
          data: {
            clave: groupData.subjectClave,
            nombre: groupData.subjectNombre,
            creditos: groupData.creditos,
          },
        });
        console.log(`✅ Created subject: ${additionalSubject.clave} - ${additionalSubject.nombre}`);
      }

      // Create or find group
      const existingGroup = await prisma.group.findFirst({
        where: {
          subjectId: additionalSubject.id,
          teacherId: teacherUser.teacher.id,
          nombre: groupData.nombre,
          periodo: groupData.periodo,
        },
      });

      if (!existingGroup) {
        const newGroup = await prisma.group.create({
          data: {
            subjectId: additionalSubject.id,
            teacherId: teacherUser.teacher.id,
            nombre: groupData.nombre,
            periodo: groupData.periodo,
          },
        });
        console.log(`✅ Created group: ${newGroup.nombre} - ${newGroup.periodo}`);
      }
    }

    console.log('\n✅ Test data created successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Teacher: ${teacherUser.teacher.nombre} ${teacherUser.teacher.apellidoPaterno}`);
    console.log(`   - Student: ${studentUser.student.nombre} ${studentUser.student.apellidoPaterno} (${studentUser.student.matricula})`);
    console.log(`   - Groups created/available for teacher`);
    console.log(`   - Enrollment ready for testing\n`);
    console.log('💡 You can now:');
    console.log('   1. Login as TEACHER and go to "Gestión de Calificaciones"');
    console.log('   2. Select a group and update student grades');
    console.log('   3. Login as STUDENT and view grades in "Calificaciones"\n');
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

createTestData()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


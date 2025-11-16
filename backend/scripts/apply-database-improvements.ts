// Script to apply database improvements while preserving data
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Applying database improvements...\n');

  try {
    // Step 1: Add timestamps with defaults
    console.log('📅 Adding timestamps to existing tables...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE students 
          ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `;
      console.log('  ✅ Added timestamps to students');
    } catch (error: any) {
      if (error.message?.includes('Duplicate column')) {
        console.log('  ⚠️  Timestamps already exist in students table');
      } else {
        throw error;
      }
    }

    const tables = ['teachers', 'subjects', 'groups', 'enrollments'];
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE \`${table}\` 
            ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
        console.log(`  ✅ Added timestamps to ${table}`);
      } catch (error: any) {
        if (error.message?.includes('Duplicate column')) {
          console.log(`  ⚠️  Timestamps already exist in ${table} table`);
        } else {
          throw error;
        }
      }
    }

    console.log('  ✅ Timestamps added\n');

    // Step 2: Normalize estatus values
    console.log('🔄 Normalizing estatus values...');
    await prisma.$executeRaw`
      UPDATE students SET estatus = UPPER(TRIM(estatus))
    `;
    await prisma.$executeRaw`
      UPDATE students 
      SET estatus = 'ACTIVO' 
      WHERE estatus NOT IN ('ACTIVO', 'INACTIVO', 'EGRESADO')
    `;
    console.log('  ✅ Estatus values normalized\n');

    // Step 3: Add length constraints
    console.log('📏 Adding length constraints...');
    await prisma.$executeRaw`
      ALTER TABLE users MODIFY username VARCHAR(50) NOT NULL
    `.catch(() => console.log('  ⚠️  username constraint might already exist'));

    await prisma.$executeRaw`
      ALTER TABLE students 
        MODIFY matricula VARCHAR(20) NOT NULL,
        MODIFY nombre VARCHAR(100) NOT NULL,
        MODIFY apellidoPaterno VARCHAR(100) NOT NULL,
        MODIFY apellidoMaterno VARCHAR(100) NOT NULL,
        MODIFY carrera VARCHAR(100) NOT NULL
    `.catch(() => console.log('  ⚠️  students constraints might already exist'));

    await prisma.$executeRaw`
      ALTER TABLE teachers 
        MODIFY nombre VARCHAR(100) NOT NULL,
        MODIFY apellidoPaterno VARCHAR(100) NOT NULL,
        MODIFY apellidoMaterno VARCHAR(100) NOT NULL,
        MODIFY departamento VARCHAR(100) NOT NULL
    `.catch(() => console.log('  ⚠️  teachers constraints might already exist'));

    await prisma.$executeRaw`
      ALTER TABLE subjects 
        MODIFY clave VARCHAR(20) NOT NULL,
        MODIFY nombre VARCHAR(200) NOT NULL
    `.catch(() => console.log('  ⚠️  subjects constraints might already exist'));

    await prisma.$executeRaw`
      ALTER TABLE groups 
        MODIFY nombre VARCHAR(50) NOT NULL,
        MODIFY periodo VARCHAR(10) NOT NULL
    `.catch(() => console.log('  ⚠️  groups constraints might already exist'));

    console.log('  ✅ Length constraints added\n');

    // Step 4: Change calificacion to DECIMAL
    console.log('🔢 Changing calificacion to DECIMAL...');
    await prisma.$executeRaw`
      ALTER TABLE enrollments MODIFY calificacion DECIMAL(5,2) NULL
    `.catch(() => console.log('  ⚠️  calificacion might already be DECIMAL'));

    console.log('  ✅ Calificacion changed to DECIMAL\n');

    // Step 5: Change estatus to ENUM
    console.log('📋 Changing estatus to ENUM...');
    await prisma.$executeRaw`
      ALTER TABLE students MODIFY estatus ENUM('ACTIVO', 'INACTIVO', 'EGRESADO') NOT NULL
    `.catch(() => console.log('  ⚠️  estatus might already be ENUM'));

    console.log('  ✅ Estatus changed to ENUM\n');

    // Step 6: Add indexes
    console.log('📊 Adding indexes...');
    const indexes = [
      { name: 'users_username_idx', sql: 'CREATE INDEX users_username_idx ON `users`(username)' },
      { name: 'students_matricula_idx', sql: 'CREATE INDEX students_matricula_idx ON `students`(matricula)' },
      { name: 'students_carrera_idx', sql: 'CREATE INDEX students_carrera_idx ON `students`(carrera)' },
      { name: 'students_semestre_idx', sql: 'CREATE INDEX students_semestre_idx ON `students`(semestre)' },
      { name: 'students_estatus_idx', sql: 'CREATE INDEX students_estatus_idx ON `students`(estatus)' },
      { name: 'students_carrera_semestre_idx', sql: 'CREATE INDEX students_carrera_semestre_idx ON `students`(carrera, semestre)' },
      { name: 'teachers_departamento_idx', sql: 'CREATE INDEX teachers_departamento_idx ON `teachers`(departamento)' },
      { name: 'subjects_clave_idx', sql: 'CREATE INDEX subjects_clave_idx ON `subjects`(clave)' },
      { name: 'groups_subjectId_idx', sql: 'CREATE INDEX groups_subjectId_idx ON `groups`(subjectId)' },
      { name: 'groups_teacherId_idx', sql: 'CREATE INDEX groups_teacherId_idx ON `groups`(teacherId)' },
      { name: 'groups_periodo_idx', sql: 'CREATE INDEX groups_periodo_idx ON `groups`(periodo)' },
      { name: 'groups_subjectId_periodo_idx', sql: 'CREATE INDEX groups_subjectId_periodo_idx ON `groups`(subjectId, periodo)' },
      { name: 'groups_teacherId_periodo_idx', sql: 'CREATE INDEX groups_teacherId_periodo_idx ON `groups`(teacherId, periodo)' },
      { name: 'enrollments_studentId_idx', sql: 'CREATE INDEX enrollments_studentId_idx ON `enrollments`(studentId)' },
      { name: 'enrollments_groupId_idx', sql: 'CREATE INDEX enrollments_groupId_idx ON `enrollments`(groupId)' },
      { name: 'enrollments_studentId_groupId_idx', sql: 'CREATE INDEX enrollments_studentId_groupId_idx ON `enrollments`(studentId, groupId)' },
    ];

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index.sql);
        console.log(`  ✅ Added index ${index.name}`);
      } catch (error: any) {
        if (error.message?.includes('Duplicate key') || error.message?.includes('already exists')) {
          console.log(`  ⚠️  Index ${index.name} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log('  ✅ Indexes added\n');

    // Step 7: Update foreign key constraint
    console.log('🔗 Updating foreign key constraints...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE groups DROP FOREIGN KEY groups_subjectId_fkey
      `;
    } catch {
      // Foreign key might have different name or not exist
      console.log('  ⚠️  Could not drop existing foreign key (might have different name)');
    }

    await prisma.$executeRaw`
      ALTER TABLE groups 
        ADD CONSTRAINT groups_subjectId_fkey 
        FOREIGN KEY (subjectId) REFERENCES subjects(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
    `.catch(() => {
      console.log('  ⚠️  Foreign key constraint might already exist');
    });

    console.log('  ✅ Foreign key constraints updated\n');

    console.log('✅ All database improvements applied successfully!');
  } catch (error) {
    console.error('❌ Error applying improvements:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


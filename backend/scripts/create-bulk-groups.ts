#!/usr/bin/env ts-node
/**
 * Script to create random test groups (grupos académicos)
 * Assigns subjects to teachers with realistic group names and periods
 * Usage: npm run create:bulk-groups [count]
 * Or: npx ts-node scripts/create-bulk-groups.ts [count]
 */

import { createPrismaClient } from '../src/config/create-prisma-client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = createPrismaClient();

// Nombres de grupos comunes
const nombresGrupos = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F'];

// Períodos académicos
const periodos = ['2024-1', '2024-2', '2025-1', '2025-2'];

// Función para obtener un elemento aleatorio de un array
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Función para obtener elementos únicos aleatorios de un array
function getRandomUniqueElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

async function createBulkGroups(count: number = 20) {
  try {
    console.log(`🔧 Creating ${count} random test groups...\n`);

    // Obtener todas las materias disponibles
    const subjects = await prisma.subject.findMany({
      orderBy: { clave: 'asc' },
    });

    if (subjects.length === 0) {
      console.error('❌ No subjects found. Please create subjects first.');
      process.exit(1);
    }

    // Obtener todos los maestros disponibles
    const teachers = await prisma.teacher.findMany({
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (teachers.length === 0) {
      console.error('❌ No teachers found. Please create teachers first.');
      process.exit(1);
    }

    console.log(`📚 Found ${subjects.length} subjects`);
    console.log(`👨‍🏫 Found ${teachers.length} teachers\n`);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Crear grupos
    for (let i = 0; i < count; i++) {
      try {
        // Seleccionar materia y maestro aleatorios
        const subject = randomElement(subjects);
        const teacher = randomElement(teachers);
        const nombreGrupo = randomElement(nombresGrupos);
        const periodo = randomElement(periodos);

        // Verificar si ya existe un grupo con la misma materia, maestro, nombre y período
        const existingGroup = await prisma.group.findFirst({
          where: {
            subjectId: subject.id,
            teacherId: teacher.id,
            nombre: nombreGrupo,
            periodo: periodo,
          },
        });

        if (existingGroup) {
          skipped++;
          console.log(`⚠️  Group "${nombreGrupo}" for ${subject.clave} with ${teacher.user.username} in ${periodo} already exists. Skipping.`);
          continue;
        }

        // Crear grupo
        const group = await prisma.group.create({
          data: {
            subjectId: subject.id,
            teacherId: teacher.id,
            nombre: nombreGrupo,
            periodo: periodo,
          },
          include: {
            subject: { select: { clave: true, nombre: true } },
            teacher: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                departamento: true,
              },
            },
          },
        });

        created++;
        console.log(
          `✅ Created: ${group.nombre} - ${group.subject.clave} (${group.subject.nombre}) - ` +
          `Prof. ${group.teacher.nombre} ${group.teacher.apellidoPaterno} - ${group.periodo}`
        );
      } catch (error: any) {
        errors.push(`Error creating group ${i + 1}: ${error.message}`);
        console.error(`❌ Error creating group ${i + 1}: ${error.message}`);
      }
    }

    console.log('\n✅ Bulk group creation completed!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created} groups`);
    console.log(`   ⚠️  Skipped: ${skipped} (already existed)`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Mostrar estadísticas
    if (created > 0) {
      const allGroups = await prisma.group.findMany({
        include: {
          subject: { select: { clave: true, nombre: true } },
          teacher: {
            select: {
              nombre: true,
              apellidoPaterno: true,
            },
          },
        },
        orderBy: { periodo: 'asc' },
      });

      console.log('\n📋 Statistics:');
      console.log(`   Total groups: ${allGroups.length}\n`);

      // Agrupar por período
      const gruposPorPeriodo: Record<string, typeof allGroups> = {};
      allGroups.forEach(group => {
        if (!gruposPorPeriodo[group.periodo]) {
          gruposPorPeriodo[group.periodo] = [];
        }
        gruposPorPeriodo[group.periodo].push(group);
      });

      console.log('📅 Groups by period:');
      Object.keys(gruposPorPeriodo).sort().forEach(periodo => {
        console.log(`   ${periodo}: ${gruposPorPeriodo[periodo].length} groups`);
      });

      // Agrupar por materia
      const gruposPorMateria: Record<string, typeof allGroups> = {};
      allGroups.forEach(group => {
        const clave = group.subject.clave;
        if (!gruposPorMateria[clave]) {
          gruposPorMateria[clave] = [];
        }
        gruposPorMateria[clave].push(group);
      });

      console.log('\n📚 Groups by subject (top 5):');
      Object.entries(gruposPorMateria)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5)
        .forEach(([clave, grupos]) => {
          console.log(`   ${clave}: ${grupos.length} groups`);
        });

      // Agrupar por maestro
      const gruposPorMaestro: Record<string, typeof allGroups> = {};
      allGroups.forEach(group => {
        const maestro = `${group.teacher.nombre} ${group.teacher.apellidoPaterno}`;
        if (!gruposPorMaestro[maestro]) {
          gruposPorMaestro[maestro] = [];
        }
        gruposPorMaestro[maestro].push(group);
      });

      console.log('\n👨‍🏫 Groups by teacher (top 5):');
      Object.entries(gruposPorMaestro)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5)
        .forEach(([maestro, grupos]) => {
          console.log(`   ${maestro}: ${grupos.length} groups`);
        });

      // Mostrar algunos ejemplos
      console.log('\n📋 Sample groups (last 5 created):');
      allGroups.slice(-5).forEach((group, index) => {
        console.log(
          `   ${index + 1}. ${group.nombre} - ${group.subject.clave} (${group.subject.nombre})`
        );
        console.log(
          `      Prof. ${group.teacher.nombre} ${group.teacher.apellidoPaterno} - ${group.periodo}`
        );
      });
    }
  } catch (error) {
    console.error('❌ Error creating bulk groups:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener el número de grupos desde argumentos de línea de comandos
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 20;

if (isNaN(count) || count < 1) {
  console.error('❌ Invalid count. Please provide a positive number.');
  process.exit(1);
}

createBulkGroups(count);


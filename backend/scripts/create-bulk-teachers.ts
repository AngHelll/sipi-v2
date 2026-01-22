#!/usr/bin/env ts-node
/**
 * Script to create random test teachers
 * Usage: npm run create:bulk-teachers [count]
 * Or: npx ts-node scripts/create-bulk-teachers.ts [count]
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Arrays de datos para generar maestros realistas
const nombres = [
  'María', 'José', 'Juan', 'Ana', 'Carlos', 'Laura', 'Miguel', 'Carmen',
  'Luis', 'Patricia', 'Pedro', 'Guadalupe', 'Francisco', 'Rosa', 'Javier',
  'Mónica', 'Antonio', 'Alejandra', 'Manuel', 'Verónica', 'Ricardo', 'Diana',
  'Fernando', 'Sandra', 'Roberto', 'Gabriela', 'Daniel', 'Mariana', 'Eduardo',
  'Andrea', 'Jorge', 'Paola', 'Alberto', 'Claudia', 'Sergio', 'Liliana',
  'Raúl', 'Adriana', 'Oscar', 'Lucía', 'Diego', 'Natalia', 'Andrés', 'Elena',
  'Rodrigo', 'Isabel', 'Mario', 'Sofía', 'Alejandro', 'Valentina', 'Gustavo',
  'Camila', 'Héctor', 'Daniela', 'Víctor', 'Carolina', 'Ángel', 'Fernanda',
  'Rafael', 'Arturo', 'Brenda', 'César', 'Cecilia', 'Emilio', 'Felipe',
  'Gerardo', 'Fabiola', 'Hugo', 'Gloria', 'Iván', 'Hilda', 'Joaquín',
  'Irene', 'Leonardo', 'Jacqueline', 'Martín', 'Karina', 'Nicolás', 'Leticia',
  'Octavio', 'Martha', 'Pablo', 'Norma', 'Ramón', 'Salvador', 'Rebeca',
  'Tomás', 'Silvia', 'Ulises', 'Teresa', 'Vicente', 'Yolanda', 'Xavier'
];

const apellidosPaternos = [
  'García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Hernández', 'Jiménez',
  'Ruiz', 'Torres', 'Díaz', 'Vargas', 'Castro', 'Romero', 'Soto', 'Mendoza',
  'Gutiérrez', 'Ramos', 'Ortega', 'Delgado', 'Vásquez', 'Cortés', 'Medina',
  'Guerrero', 'Rojas', 'Contreras', 'Álvarez', 'Moreno', 'Herrera', 'Vega',
  'Campos', 'Reyes', 'Núñez', 'Aguilar', 'Silva', 'Méndez', 'Rivera',
  'Valdez', 'Espinoza', 'Molina', 'Ortiz', 'Chávez', 'Velázquez', 'Fuentes'
];

const apellidosMaternos = [
  'García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Hernández', 'Jiménez',
  'Ruiz', 'Torres', 'Díaz', 'Vargas', 'Castro', 'Romero', 'Soto', 'Mendoza',
  'Gutiérrez', 'Ramos', 'Ortega', 'Delgado', 'Vásquez', 'Cortés', 'Medina',
  'Guerrero', 'Rojas', 'Contreras', 'Álvarez', 'Moreno', 'Herrera', 'Vega',
  'Campos', 'Reyes', 'Núñez', 'Aguilar', 'Silva', 'Méndez', 'Rivera',
  'Valdez', 'Espinoza', 'Molina', 'Ortiz', 'Chávez', 'Velázquez', 'Fuentes'
];

const departamentos = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Industrial',
  'Ingeniería Mecánica',
  'Ingeniería Eléctrica',
  'Ingeniería Civil',
  'Ingeniería Química',
  'Ingeniería en Electrónica',
  'Administración',
  'Contaduría',
  'Derecho',
  'Psicología',
  'Pedagogía',
  'Comunicación',
  'Arquitectura',
  'Diseño Gráfico',
  'Enfermería',
  'Medicina',
  'Nutrición',
  'Turismo',
  'Mercadotecnia',
  'Matemáticas',
  'Física',
  'Química',
  'Biología',
  'Historia',
  'Literatura',
  'Idiomas',
  'Economía',
  'Finanzas',
  'Recursos Humanos'
];

// Función para generar un número aleatorio entre min y max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para obtener un elemento aleatorio de un array
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

// Función para generar un username único
function generateUsername(nombre: string, apellidoPaterno: string, index: number): string {
  const base = `${nombre.toLowerCase()}.${apellidoPaterno.toLowerCase()}`;
  // Limitar a 50 caracteres (límite del schema)
  const username = base.length > 45 ? base.substring(0, 45) : base;
  return `${username}${index}`;
}

async function createBulkTeachers(count: number = 10) {
  try {
    console.log(`🔧 Creating ${count} random test teachers...\n`);

    const defaultPassword = 'teacher123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Procesar en lotes de 5 para mejor rendimiento
    const batchSize = 5;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      const batchCount = batchEnd - batchStart;

      console.log(`📦 Processing batch ${batch + 1}/${batches} (teachers ${batchStart + 1}-${batchEnd})...`);

      const teachersToCreate = [];

      for (let i = 0; i < batchCount; i++) {
        const globalIndex = batchStart + i + 1;
        const nombre = randomElement(nombres);
        const apellidoPaterno = randomElement(apellidosPaternos);
        const apellidoMaterno = randomElement(apellidosMaternos);
        const departamento = randomElement(departamentos);
        const username = generateUsername(nombre, apellidoPaterno, globalIndex);

        teachersToCreate.push({
          username,
          passwordHash,
          role: UserRole.TEACHER,
          teacher: {
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            departamento,
          },
        });
      }

      // Crear maestros en transacciones
      for (const teacherData of teachersToCreate) {
        try {
          // Verificar si el username ya existe
          const existingUser = await prisma.user.findUnique({
            where: { username: teacherData.username },
          });

          if (existingUser) {
            skipped++;
            continue;
          }

          // Crear usuario y maestro en una transacción
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                username: teacherData.username,
                passwordHash: teacherData.passwordHash,
                role: teacherData.role,
              },
            });

            await tx.teacher.create({
              data: {
                userId: user.id,
                nombre: teacherData.teacher.nombre,
                apellidoPaterno: teacherData.teacher.apellidoPaterno,
                apellidoMaterno: teacherData.teacher.apellidoMaterno,
                departamento: teacherData.teacher.departamento,
              },
            });
          });

          created++;
        } catch (error: any) {
          errors.push(`Error creating ${teacherData.username}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Bulk teacher creation completed!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created} teachers`);
    console.log(`   ⚠️  Skipped: ${skipped} (already existed)`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    console.log('\n💡 Default credentials for all teachers:');
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Username format: nombre.apellido{number}`);
    console.log(`   Example: carlos.garcia1, maria.lopez2, etc.\n`);

    // Mostrar algunos ejemplos
    if (created > 0) {
      const sampleTeachers = await prisma.teacher.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      });

      console.log('📋 Sample created teachers:');
      sampleTeachers.forEach((teacher, index) => {
        console.log(`   ${index + 1}. ${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`);
        console.log(`      Username: ${teacher.user.username}`);
        console.log(`      Departamento: ${teacher.departamento}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error creating bulk teachers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener el número de maestros desde argumentos de línea de comandos
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 10;

if (isNaN(count) || count < 1) {
  console.error('❌ Invalid count. Please provide a positive number.');
  process.exit(1);
}

createBulkTeachers(count);



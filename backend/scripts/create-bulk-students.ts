#!/usr/bin/env ts-node
/**
 * Script to create 100 random test students
 * Usage: npm run create:bulk-students
 * Or: npx ts-node scripts/create-bulk-students.ts
 */

import { PrismaClient, UserRole, StudentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Arrays de datos para generar estudiantes realistas
const nombres = [
  'María', 'José', 'Juan', 'Ana', 'Carlos', 'Laura', 'Miguel', 'Carmen',
  'Luis', 'Patricia', 'Pedro', 'Guadalupe', 'Francisco', 'Rosa', 'Javier',
  'Mónica', 'Antonio', 'Alejandra', 'Manuel', 'Verónica', 'Ricardo', 'Diana',
  'Fernando', 'Sandra', 'Roberto', 'Gabriela', 'Daniel', 'Mariana', 'Eduardo',
  'Andrea', 'Jorge', 'Paola', 'Alberto', 'Claudia', 'Sergio', 'Liliana',
  'Raúl', 'Adriana', 'Oscar', 'Lucía', 'Diego', 'Natalia', 'Andrés', 'Elena',
  'Rodrigo', 'Isabel', 'Mario', 'Sofía', 'Alejandro', 'Valentina', 'Gustavo',
  'Camila', 'Héctor', 'Daniela', 'Víctor', 'Carolina', 'Ángel', 'Fernanda',
  'Rafael', 'Alejandra', 'Arturo', 'Brenda', 'César', 'Cecilia', 'Emilio',
  'Dolores', 'Felipe', 'Esperanza', 'Gerardo', 'Fabiola', 'Hugo', 'Gloria',
  'Iván', 'Hilda', 'Joaquín', 'Irene', 'Leonardo', 'Jacqueline', 'Martín',
  'Karina', 'Nicolás', 'Leticia', 'Octavio', 'Martha', 'Pablo', 'Norma',
  'Quirino', 'Olga', 'Ramón', 'Patricia', 'Salvador', 'Rebeca', 'Tomás',
  'Silvia', 'Ulises', 'Teresa', 'Vicente', 'Yolanda', 'Xavier', 'Zulema'
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

const carreras = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Industrial',
  'Ingeniería Mecánica',
  'Ingeniería Eléctrica',
  'Ingeniería Civil',
  'Ingeniería Química',
  'Ingeniería en Electrónica',
  'Licenciatura en Administración',
  'Licenciatura en Contaduría',
  'Licenciatura en Derecho',
  'Licenciatura en Psicología',
  'Licenciatura en Pedagogía',
  'Licenciatura en Comunicación',
  'Licenciatura en Arquitectura',
  'Licenciatura en Diseño Gráfico',
  'Licenciatura en Enfermería',
  'Licenciatura en Medicina',
  'Licenciatura en Nutrición',
  'Licenciatura en Turismo',
  'Licenciatura en Mercadotecnia'
];

const estatusOptions: StudentStatus[] = ['ACTIVO', 'INACTIVO', 'EGRESADO'];

// Función para generar un número aleatorio entre min y max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para obtener un elemento aleatorio de un array
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

// Función para generar una matrícula única
function generateMatricula(year: number, index: number): string {
  const paddedIndex = String(index).padStart(6, '0');
  return `${year}-${paddedIndex}`;
}

// Función para generar un username único
function generateUsername(nombre: string, apellidoPaterno: string, index: number): string {
  const base = `${nombre.toLowerCase()}.${apellidoPaterno.toLowerCase()}`;
  // Limitar a 50 caracteres (límite del schema)
  const username = base.length > 45 ? base.substring(0, 45) : base;
  return `${username}${index}`;
}

// Función para generar un CURP básico (formato simplificado)
function generateCURP(nombre: string, apellidoPaterno: string, apellidoMaterno: string, index: number): string {
  // Formato simplificado: 4 letras + 6 números + 2 letras + 4 números + 1 letra + 1 número
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  
  const letras1 = apellidoPaterno.substring(0, 2).toUpperCase().padEnd(2, 'X');
  const letras2 = apellidoMaterno.substring(0, 1).toUpperCase() || 'X';
  const letras3 = nombre.substring(0, 1).toUpperCase() || 'X';
  
  const fecha = '950101'; // Fecha de nacimiento ejemplo
  const genero = randomElement(['H', 'M']);
  const estado = 'DF'; // Estado ejemplo
  const homoclave = String(index).padStart(2, '0');
  const verificador = numeros[randomInt(0, numeros.length - 1)];
  
  return `${letras1}${letras2}${letras3}${fecha}${genero}${estado}${homoclave}${verificador}`.substring(0, 18);
}

async function createBulkStudents(count: number = 100) {
  try {
    console.log(`🔧 Creating ${count} random test students...\n`);

    const year = 2024;
    const defaultPassword = 'student123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Procesar en lotes de 10 para mejor rendimiento
    const batchSize = 10;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      const batchCount = batchEnd - batchStart;

      console.log(`📦 Processing batch ${batch + 1}/${batches} (students ${batchStart + 1}-${batchEnd})...`);

      const studentsToCreate = [];

      for (let i = 0; i < batchCount; i++) {
        const globalIndex = batchStart + i + 1;
        const nombre = randomElement(nombres);
        const apellidoPaterno = randomElement(apellidosPaternos);
        const apellidoMaterno = randomElement(apellidosMaternos);
        const carrera = randomElement(carreras);
        const semestre = randomInt(1, 12);
        const estatus = randomElement(estatusOptions);
        const matricula = generateMatricula(year, globalIndex);
        const username = generateUsername(nombre, apellidoPaterno, globalIndex);
        const curp = generateCURP(nombre, apellidoPaterno, apellidoMaterno, globalIndex);

        studentsToCreate.push({
          username,
          passwordHash,
          role: UserRole.STUDENT,
          student: {
            matricula,
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            carrera,
            semestre,
            estatus,
            curp: Math.random() > 0.3 ? curp : null, // 70% tendrán CURP
          },
        });
      }

      // Crear estudiantes en transacciones
      for (const studentData of studentsToCreate) {
        try {
          // Verificar si el username ya existe
          const existingUser = await prisma.user.findUnique({
            where: { username: studentData.username },
          });

          if (existingUser) {
            skipped++;
            continue;
          }

          // Verificar si la matrícula ya existe
          const existingMatricula = await prisma.student.findUnique({
            where: { matricula: studentData.student.matricula },
          });

          if (existingMatricula) {
            skipped++;
            continue;
          }

          // Crear usuario y estudiante en una transacción
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                username: studentData.username,
                passwordHash: studentData.passwordHash,
                role: studentData.role,
              },
            });

            await tx.student.create({
              data: {
                userId: user.id,
                matricula: studentData.student.matricula,
                nombre: studentData.student.nombre,
                apellidoPaterno: studentData.student.apellidoPaterno,
                apellidoMaterno: studentData.student.apellidoMaterno,
                carrera: studentData.student.carrera,
                semestre: studentData.student.semestre,
                estatus: studentData.student.estatus,
                curp: studentData.student.curp,
              },
            });
          });

          created++;
        } catch (error: any) {
          errors.push(`Error creating ${studentData.username}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Bulk student creation completed!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created} students`);
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

    console.log('\n💡 Default credentials for all students:');
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Username format: nombre.apellido{number}`);
    console.log(`   Example: maria.garcia1, juan.lopez2, etc.\n`);

    // Mostrar algunos ejemplos
    if (created > 0) {
      const sampleStudents = await prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      });

      console.log('📋 Sample created students:');
      sampleStudents.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno}`);
        console.log(`      Username: ${student.user.username}`);
        console.log(`      Matrícula: ${student.matricula}`);
        console.log(`      Carrera: ${student.carrera}`);
        console.log(`      Semestre: ${student.semestre}`);
        console.log(`      Estatus: ${student.estatus}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error creating bulk students:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener el número de estudiantes desde argumentos de línea de comandos
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 100;

if (isNaN(count) || count < 1) {
  console.error('❌ Invalid count. Please provide a positive number.');
  process.exit(1);
}

createBulkStudents(count);


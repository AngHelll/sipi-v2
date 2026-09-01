#!/usr/bin/env ts-node
/**
 * Script to create random test subjects (materias)
 * Usage: npm run create:bulk-subjects [count]
 * Or: npx ts-node scripts/create-bulk-subjects.ts [count]
 */

import { createPrismaClient } from '../src/config/create-prisma-client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = createPrismaClient();

// Array de materias académicas realistas con claves y créditos
const materias = [
  // Matemáticas y Ciencias Básicas
  { clave: 'MAT-101', nombre: 'Álgebra Lineal', creditos: 6 },
  { clave: 'MAT-102', nombre: 'Cálculo Diferencial', creditos: 6 },
  { clave: 'MAT-201', nombre: 'Cálculo Integral', creditos: 6 },
  { clave: 'FIS-101', nombre: 'Física I', creditos: 6 },
  { clave: 'QUI-101', nombre: 'Química General', creditos: 5 },
  
  // Ingeniería en Sistemas
  { clave: 'IS-101', nombre: 'Programación I', creditos: 6 },
  { clave: 'IS-102', nombre: 'Estructuras de Datos', creditos: 6 },
  { clave: 'IS-201', nombre: 'Programación II', creditos: 6 },
  { clave: 'IS-202', nombre: 'Bases de Datos', creditos: 6 },
  { clave: 'IS-301', nombre: 'Ingeniería de Software', creditos: 6 },
  { clave: 'IS-302', nombre: 'Sistemas Operativos', creditos: 5 },
  { clave: 'IS-401', nombre: 'Desarrollo Web', creditos: 6 },
  { clave: 'IS-402', nombre: 'Redes de Computadoras', creditos: 5 },
  
  // Ingeniería Industrial
  { clave: 'II-101', nombre: 'Introducción a la Ingeniería Industrial', creditos: 4 },
  { clave: 'II-201', nombre: 'Estadística Aplicada', creditos: 6 },
  { clave: 'II-301', nombre: 'Investigación de Operaciones', creditos: 6 },
  { clave: 'II-302', nombre: 'Control de Calidad', creditos: 5 },
  
  // Administración
  { clave: 'ADM-101', nombre: 'Introducción a la Administración', creditos: 4 },
  { clave: 'ADM-201', nombre: 'Contabilidad General', creditos: 6 },
  { clave: 'ADM-202', nombre: 'Recursos Humanos', creditos: 5 },
  { clave: 'ADM-301', nombre: 'Mercadotecnia', creditos: 6 },
  { clave: 'ADM-302', nombre: 'Finanzas Corporativas', creditos: 6 },
  
  // Derecho
  { clave: 'DER-101', nombre: 'Introducción al Derecho', creditos: 4 },
  { clave: 'DER-201', nombre: 'Derecho Civil', creditos: 6 },
  { clave: 'DER-202', nombre: 'Derecho Penal', creditos: 6 },
  { clave: 'DER-301', nombre: 'Derecho Constitucional', creditos: 6 },
  
  // Psicología
  { clave: 'PSI-101', nombre: 'Introducción a la Psicología', creditos: 4 },
  { clave: 'PSI-201', nombre: 'Psicología del Desarrollo', creditos: 6 },
  { clave: 'PSI-202', nombre: 'Psicología Social', creditos: 5 },
  { clave: 'PSI-301', nombre: 'Psicología Clínica', creditos: 6 },
  
  // Arquitectura
  { clave: 'ARQ-101', nombre: 'Dibujo Arquitectónico', creditos: 5 },
  { clave: 'ARQ-201', nombre: 'Historia de la Arquitectura', creditos: 4 },
  { clave: 'ARQ-301', nombre: 'Diseño Arquitectónico', creditos: 8 },
  
  // Comunicación
  { clave: 'COM-101', nombre: 'Teoría de la Comunicación', creditos: 4 },
  { clave: 'COM-201', nombre: 'Producción Audiovisual', creditos: 6 },
  { clave: 'COM-301', nombre: 'Periodismo Digital', creditos: 5 },
  
  // Enfermería
  { clave: 'ENF-101', nombre: 'Anatomía y Fisiología', creditos: 6 },
  { clave: 'ENF-201', nombre: 'Fundamentos de Enfermería', creditos: 6 },
  { clave: 'ENF-301', nombre: 'Enfermería Clínica', creditos: 8 },
  
  // Ingeniería Civil
  { clave: 'IC-101', nombre: 'Dibujo Técnico', creditos: 4 },
  { clave: 'IC-201', nombre: 'Mecánica de Materiales', creditos: 6 },
  { clave: 'IC-301', nombre: 'Diseño Estructural', creditos: 6 },
  
  // Ingeniería Eléctrica
  { clave: 'IE-101', nombre: 'Circuitos Eléctricos I', creditos: 6 },
  { clave: 'IE-201', nombre: 'Circuitos Eléctricos II', creditos: 6 },
  { clave: 'IE-301', nombre: 'Máquinas Eléctricas', creditos: 6 },
  
  // Ingeniería Mecánica
  { clave: 'IM-101', nombre: 'Mecánica Clásica', creditos: 6 },
  { clave: 'IM-201', nombre: 'Termodinámica', creditos: 6 },
  { clave: 'IM-301', nombre: 'Diseño Mecánico', creditos: 6 },
  
  // Diseño Gráfico
  { clave: 'DG-101', nombre: 'Fundamentos del Diseño', creditos: 5 },
  { clave: 'DG-201', nombre: 'Diseño Digital', creditos: 6 },
  { clave: 'DG-301', nombre: 'Branding y Identidad Visual', creditos: 6 },
  
  // Turismo
  { clave: 'TUR-101', nombre: 'Introducción al Turismo', creditos: 4 },
  { clave: 'TUR-201', nombre: 'Gestión Hotelera', creditos: 5 },
  { clave: 'TUR-301', nombre: 'Planificación Turística', creditos: 6 },
  
  // Nutrición
  { clave: 'NUT-101', nombre: 'Nutrición Básica', creditos: 5 },
  { clave: 'NUT-201', nombre: 'Bioquímica Nutricional', creditos: 6 },
  { clave: 'NUT-301', nombre: 'Nutrición Clínica', creditos: 6 },
  
  // Idiomas
  { clave: 'ING-101', nombre: 'Inglés I', creditos: 4 },
  { clave: 'ING-201', nombre: 'Inglés II', creditos: 4 },
  { clave: 'FRA-101', nombre: 'Francés I', creditos: 4 },
  
  // Materias Generales
  { clave: 'FIL-101', nombre: 'Filosofía', creditos: 4 },
  { clave: 'HIS-101', nombre: 'Historia de México', creditos: 4 },
  { clave: 'LIT-101', nombre: 'Literatura Universal', creditos: 4 },
  { clave: 'ETI-101', nombre: 'Ética Profesional', creditos: 3 },
];

// Función para obtener un elemento aleatorio de un array
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Función para obtener elementos únicos aleatorios de un array
function getRandomUniqueElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

async function createBulkSubjects(count: number = 12) {
  try {
    console.log(`🔧 Creating ${count} random test subjects...\n`);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Obtener materias aleatorias únicas
    const materiasToCreate = getRandomUniqueElements(materias, count);

    for (const materia of materiasToCreate) {
      try {
        // Verificar si la clave ya existe
        const existingSubject = await prisma.subject.findUnique({
          where: { clave: materia.clave },
        });

        if (existingSubject) {
          skipped++;
          console.log(`⚠️  Subject with clave "${materia.clave}" already exists. Skipping.`);
          continue;
        }

        // Crear materia
        const subject = await prisma.subject.create({
          data: {
            clave: materia.clave,
            nombre: materia.nombre,
            creditos: materia.creditos,
          },
        });

        created++;
        console.log(`✅ Created: ${subject.clave} - ${subject.nombre} (${subject.creditos} créditos)`);
      } catch (error: any) {
        errors.push(`Error creating ${materia.clave}: ${error.message}`);
        console.error(`❌ Error creating ${materia.clave}: ${error.message}`);
      }
    }

    console.log('\n✅ Bulk subject creation completed!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created} subjects`);
    console.log(`   ⚠️  Skipped: ${skipped} (already existed)`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Mostrar todas las materias creadas
    if (created > 0) {
      const allSubjects = await prisma.subject.findMany({
        orderBy: { clave: 'asc' },
      });

      console.log('\n📋 All subjects in database:');
      console.log(`   Total: ${allSubjects.length} subjects\n`);
      
      // Agrupar por área
      const groupedByArea: Record<string, typeof allSubjects> = {};
      allSubjects.forEach(subject => {
        const area = subject.clave.split('-')[0];
        if (!groupedByArea[area]) {
          groupedByArea[area] = [];
        }
        groupedByArea[area].push(subject);
      });

      Object.keys(groupedByArea).sort().forEach(area => {
        console.log(`   ${area}:`);
        groupedByArea[area].forEach(subject => {
          console.log(`      - ${subject.clave}: ${subject.nombre} (${subject.creditos} créditos)`);
        });
      });
    }
  } catch (error) {
    console.error('❌ Error creating bulk subjects:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener el número de materias desde argumentos de línea de comandos
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 12;

if (isNaN(count) || count < 1) {
  console.error('❌ Invalid count. Please provide a positive number.');
  process.exit(1);
}

if (count > materias.length) {
  console.warn(`⚠️  Warning: Requested ${count} subjects, but only ${materias.length} available. Creating ${materias.length} subjects.`);
}

createBulkSubjects(Math.min(count, materias.length));


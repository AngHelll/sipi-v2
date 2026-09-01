#!/usr/bin/env ts-node
/**
 * Seed 10 careers with proper UTF-8 (Spanish accents).
 * Usage: npm run seed:careers
 */

import { createPrismaClient } from '../src/config/create-prisma-client';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = createPrismaClient();

const CAREERS = [
  {
    codigo: 'ISC',
    nombre: 'Ingeniería en Sistemas Computacionales',
    nombreCorto: 'Sistemas',
    area: 'Ingeniería',
    duracionSemestres: 10,
  },
  {
    codigo: 'IND',
    nombre: 'Ingeniería Industrial',
    nombreCorto: 'Industrial',
    area: 'Ingeniería',
    duracionSemestres: 10,
  },
  {
    codigo: 'MEC',
    nombre: 'Ingeniería Mecatrónica',
    nombreCorto: 'Mecatrónica',
    area: 'Ingeniería',
    duracionSemestres: 10,
  },
  {
    codigo: 'ADM',
    nombre: 'Administración de Empresas',
    nombreCorto: 'Administración',
    area: 'Ciencias Económicas',
    duracionSemestres: 8,
  },
  {
    codigo: 'CON',
    nombre: 'Contaduría Pública',
    nombreCorto: 'Contaduría',
    area: 'Ciencias Económicas',
    duracionSemestres: 8,
  },
  {
    codigo: 'DER',
    nombre: 'Derecho',
    nombreCorto: 'Derecho',
    area: 'Ciencias Sociales',
    duracionSemestres: 10,
  },
  {
    codigo: 'PSI',
    nombre: 'Psicología',
    nombreCorto: 'Psicología',
    area: 'Ciencias de la Salud',
    duracionSemestres: 8,
  },
  {
    codigo: 'ARQ',
    nombre: 'Arquitectura',
    nombreCorto: 'Arquitectura',
    area: 'Diseño y Artes',
    duracionSemestres: 10,
  },
  {
    codigo: 'COM',
    nombre: 'Ciencias de la Comunicación',
    nombreCorto: 'Comunicación',
    area: 'Humanidades',
    duracionSemestres: 8,
  },
  {
    codigo: 'MED',
    nombre: 'Medicina',
    nombreCorto: 'Medicina',
    area: 'Ciencias de la Salud',
    duracionSemestres: 12,
  },
] as const;

async function main(): Promise<void> {
  console.log('\n📚 Cargando carreras (UTF-8)...\n');

  let created = 0;
  let updated = 0;

  for (const item of CAREERS) {
    const existing = await prisma.careers.findUnique({
      where: { codigo: item.codigo },
    });

    const now = new Date();

    if (existing) {
      await prisma.careers.update({
        where: { id: existing.id },
        data: {
          nombre: item.nombre,
          nombreCorto: item.nombreCorto,
          area: item.area,
          duracionSemestres: item.duracionSemestres,
          estatus: 'ACTIVA',
          deletedAt: null,
          updatedAt: now,
        },
      });
      updated++;
      console.log(`   ↻ ${item.codigo} — ${item.nombre}`);
    } else {
      await prisma.careers.create({
        data: {
          id: randomUUID(),
          codigo: item.codigo,
          nombre: item.nombre,
          nombreCorto: item.nombreCorto,
          area: item.area,
          duracionSemestres: item.duracionSemestres,
          estatus: 'ACTIVA',
          updatedAt: now,
        },
      });
      created++;
      console.log(`   ✅ ${item.codigo} — ${item.nombre}`);
    }
  }

  const total = await prisma.careers.count({ where: { deletedAt: null, estatus: 'ACTIVA' } });
  console.log(`\n✅ Listo: ${created} nuevas, ${updated} actualizadas. Activas: ${total}\n`);
}

main()
  .catch((e) => {
    console.error('❌', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

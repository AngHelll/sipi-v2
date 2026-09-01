import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const logLevels =
  process.env.NODE_ENV === 'development'
    ? (['query', 'error', 'warn'] as const)
    : (['error'] as const);

/**
 * Crea PrismaClient con adapter MariaDB (requerido en Prisma 7).
 */
export function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({
    adapter,
    log: [...logLevels],
  });
}

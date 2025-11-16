// Database configuration and Prisma client setup
import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
// This ensures we only have one instance of PrismaClient across the app
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown: disconnect Prisma on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;


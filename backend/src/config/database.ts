// Database configuration and Prisma client setup
import { createPrismaClient } from './create-prisma-client';

const prisma = createPrismaClient();

// Graceful shutdown: disconnect Prisma on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

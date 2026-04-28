import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function connectMySQL(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('MySQL connected via Prisma');
  } catch (error) {
    console.error('Failed to connect to MySQL:', error);
    throw error;
  }
}

export async function disconnectMySQL(): Promise<void> {
  await prisma.$disconnect();
  console.log('MySQL disconnected');
}

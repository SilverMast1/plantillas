import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Solución global para serialización de BigInt en Express / JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

export async function optimizarSQLite() {
  try {
    console.log('Optimizando base de datos SQLite...');
    await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous=NORMAL;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout=15000;');
    console.log('SQLite optimizado con éxito (WAL, Synchronous NORMAL, Busy Timeout 15s).');
  } catch (error) {
    console.error('Error al optimizar SQLite:', error);
  }
}

export default prisma;
export { prisma };


import prisma from './db';

async function optimize() {
  console.log('Enabling WAL (Write-Ahead Logging) mode on SQLite...');
  await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
  
  console.log('Setting synchronous mode to NORMAL...');
  await prisma.$queryRawUnsafe('PRAGMA synchronous=NORMAL;');
  
  console.log('Executing VACUUM to defragment database file...');
  await prisma.$executeRawUnsafe('VACUUM;');
  
  console.log('Database optimization completed successfully!');
}

optimize().catch(console.error);

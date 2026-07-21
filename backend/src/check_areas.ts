import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const areas = await prisma.area.findMany();
  console.log(areas);
}
run().catch(console.error).finally(() => prisma.$disconnect());

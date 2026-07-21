import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const prods = await prisma.producto.findMany({
    include: { inventarios: true }
  });
  const p = prods.filter((x: any) => x.nombre.toLowerCase().includes('taco') && x.inventarios.some((i: any) => i.area_id === 1));
  console.log(JSON.stringify(p, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const prods = await prisma.producto.findMany({
    where: { nombre: { contains: 'taco' } }
  });
  console.log("Found products:", prods.map(p => p.nombre));

  for (const p of prods) {
    await prisma.inventarioArea.updateMany({
      where: {
        producto_id: p.id,
        area_id: 1 // 1 is Bar
      },
      data: {
        stock: 999
      }
    });
  }
  
  console.log("Updated stock to 999 in Bar for tacos.");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

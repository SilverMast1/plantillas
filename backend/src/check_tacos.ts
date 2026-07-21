import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const prods = await prisma.inventarioArea.findMany({
    where: { 
      area_id: 1, 
      producto: { 
        nombre: { contains: 'taco' } 
      } 
    },
    include: { producto: true }
  });
  
  for (const p of prods as any[]) {
    console.log(p.producto.nombre, p.stock.toString());
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

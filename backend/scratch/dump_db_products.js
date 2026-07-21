const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.producto.findMany({
    orderBy: { nombre: 'asc' }
  });
  console.log(JSON.stringify(products.map(p => ({
    id: p.id,
    nombre: p.nombre,
    precio_venta: p.precio_venta.toString(),
    categoria: p.categoria,
    activo: p.activo
  })), null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);

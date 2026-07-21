const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.producto.findMany({
    orderBy: { nombre: 'asc' }
  });
  const mapped = products.map(p => ({
    id: p.id,
    nombre: p.nombre,
    precio_venta: p.precio_venta.toString(),
    categoria: p.categoria,
    activo: p.activo
  }));
  fs.writeFileSync('scratch/db_products_all.json', JSON.stringify(mapped, null, 2));
  console.log(`Wrote ${mapped.length} products to scratch/db_products_all.json`);
  await prisma.$disconnect();
}

run().catch(console.error);

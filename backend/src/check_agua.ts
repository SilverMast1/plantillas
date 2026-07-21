import prisma from './db';

async function main() {
  console.log("=== BUSCANDO AGUA MINERAL GRANDE ===");
  const products = await prisma.producto.findMany({
    where: {
      nombre: { contains: 'Agua Mineral' }
    }
  });

  console.log("Productos encontrados:", products.map(p => ({
    id: p.id,
    nombre: p.nombre,
    precio_venta: Number(p.precio_venta),
    activo: p.activo
  })));

  for (const p of products) {
    const inv = await prisma.inventarioArea.findMany({
      where: { producto_id: p.id }
    });
    console.log(`Inventario de área para "${p.nombre}" (ID ${p.id}):`, inv.map(i => ({
      area_id: i.area_id,
      stock: Number(i.stock)
    })));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

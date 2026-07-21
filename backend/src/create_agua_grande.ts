import prisma from './db';
import { Decimal } from 'decimal.js';

async function main() {
  console.log("=== CREANDO AGUA MINERAL GRANDE ===");
  
  // Buscar si ya existe
  const existente = await prisma.producto.findFirst({
    where: { nombre: { equals: 'Agua Mineral Grande' } }
  });

  if (existente) {
    console.log("El producto 'Agua Mineral Grande' ya existe:", existente);
    return;
  }

  // Crear el producto
  const nuevo = await prisma.producto.create({
    data: {
      nombre: 'Agua Mineral Grande',
      precio_venta: new Decimal(0),
      categoria: 'Bebidas',
      descripcion: 'Agua mineral grande para preparado (no para venta directa)',
      activo: true
    }
  });

  console.log("Producto creado:", nuevo);

  // Crear registros de inventario en las 3 áreas
  const areas = [1, 2, 3];
  for (const areaId of areas) {
    const inv = await prisma.inventarioArea.create({
      data: {
        area_id: areaId,
        producto_id: nuevo.id,
        stock: new Decimal(0),
        stock_minimo: new Decimal(5),
        stock_maximo: new Decimal(999)
      }
    });
    console.log(`Registrado en área ${areaId} con stock 0:`, inv);
  }

  console.log("=== PROCESO COMPLETADO EXCELENTEMENTE ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

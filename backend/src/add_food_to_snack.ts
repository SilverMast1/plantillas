import { prisma } from './db';

async function main() {
  // Find all products in category 'Alimentos'
  const foodProducts = await prisma.producto.findMany({
    where: {
      categoria: 'Alimentos'
    }
  });

  const snackAreaId = 2; // Snack
  console.log(`Found ${foodProducts.length} food products. Adding to Snack area...`);

  let addedCount = 0;
  for (const product of foodProducts) {
    // Check if it already exists in Snack area
    const existing = await prisma.inventarioArea.findUnique({
      where: {
        area_id_producto_id: {
          area_id: snackAreaId,
          producto_id: product.id
        }
      }
    });

    if (!existing) {
      await prisma.inventarioArea.create({
        data: {
          area_id: snackAreaId,
          producto_id: product.id,
          stock: 100.0,
          stock_minimo: 10.0,
          stock_maximo: 200.0
        }
      });
      console.log(`Added "${product.nombre}" (ID: ${product.id}) to Snack area.`);
      addedCount++;
    } else {
      console.log(`"${product.nombre}" (ID: ${product.id}) already exists in Snack area.`);
    }
  }

  console.log(`Finished. Added ${addedCount} products to Snack area.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

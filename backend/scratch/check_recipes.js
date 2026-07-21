const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const recipes = await prisma.recetaIngrediente.findMany({
    include: {
      producto: true,
      insumo: true
    }
  });

  console.log('Recipes in DB:');
  recipes.forEach(r => {
    console.log(`Product: ${r.producto.nombre} (ID: ${r.producto_id}), Insumo: ${r.insumo.nombre}, Cantidad: ${r.cantidad}`);
  });
  await prisma.$disconnect();
}

run().catch(console.error);

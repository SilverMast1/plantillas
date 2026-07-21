const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Buscando Cuentas con Platillo ---');
  const cuentas = await prisma.cuenta.findMany({
    where: {
      estado: 'ABIERTA'
    },
    include: {
      detalleCuentas: {
        include: {
          producto: true
        }
      },
      cliente: true
    }
  });

  for (const c of cuentas) {
    const tienePlatillo = c.detalleCuentas.some(d => d.producto.nombre.toLowerCase().includes('platillo'));
    if (tienePlatillo) {
      console.log(`Cuenta ID: ${c.id}`);
      console.log(`Referencia: ${c.nombre_referencia}`);
      console.log(`Cliente: ${c.cliente ? c.cliente.nombre : 'Sin Cliente'}`);
      console.log(`Detalles:`, c.detalleCuentas.map(d => `${d.cantidad}x ${d.producto.nombre} ($${d.precio_unitario})`));
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

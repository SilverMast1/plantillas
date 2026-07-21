const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Buscando cualquier cuenta de Ivan con Platillo ---');
  const detalles = await prisma.detalleCuenta.findMany({
    where: {
      producto: {
        nombre: {
          contains: 'Platillo'
        }
      }
    },
    include: {
      cuenta: {
        include: {
          cliente: true,
          divisionesCuentas: {
            include: {
              cliente: true
            }
          }
        }
      },
      producto: true
    }
  });

  console.log(`Encontrados ${detalles.length} detalles con Platillo:`);
  for (const d of detalles) {
    console.log(`Detalle ID: ${d.id}, Cantidad: ${d.cantidad}, Precio: ${d.precio_unitario}`);
    console.log(`Cuenta ID: ${d.cuenta_id}, Estado: ${d.cuenta.estado}, Total: ${d.cuenta.total}`);
    console.log(`Cuenta Cliente: ${d.cuenta.cliente ? d.cuenta.cliente.nombre : 'Sin Cliente'}`);
    console.log(`Divisiones:`, d.cuenta.divisionesCuentas.map(div => `${div.cliente.nombre}: ${div.estado_pago} ($${div.monto_proporcional})`));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

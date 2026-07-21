import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('--- LIMPIANDO BASE DE DATOS (DEJANDO SOLO PRODUCTOS Y PERSONAL) ---');

  // 1. Limpiar transacciones de cuentas y pagos
  console.log('Eliminando divisiones de cuentas...');
  await prisma.divisionCuenta.deleteMany({});

  console.log('Eliminando detalles de cuentas...');
  await prisma.detalleCuenta.deleteMany({});

  console.log('Eliminando cuentas...');
  await prisma.cuenta.deleteMany({});

  // 2. Limpiar retiros y turnos de caja
  console.log('Eliminando retiros de caja...');
  await prisma.retiroCaja.deleteMany({});

  console.log('Eliminando turnos de caja...');
  await prisma.turno.deleteMany({});

  // 3. Limpiar asignaciones y socios/clientes
  console.log('Eliminando asignaciones de cadi...');
  await prisma.asignacionCadiCliente.deleteMany({});

  console.log('Eliminando clientes/socios...');
  await prisma.cliente.deleteMany({});

  // 4. Limpiar movimientos de inventario (Kardex)
  console.log('Eliminando historial de movimientos de inventario...');
  await prisma.movimientoInventario.deleteMany({});

  // 5. Limpiar registros de gastos e ingresos semanales
  console.log('Eliminando gastos e ingresos (CCLourdes)...');
  await prisma.gastoIngresoCCL.deleteMany({});

  // 6. Resetear stock de inventarios a 20 para todos los productos en todas las áreas
  console.log('Restableciendo stock de inventarios a 20 unidades...');
  const inventarios = await prisma.inventarioArea.findMany();
  for (const inv of inventarios) {
    await prisma.inventarioArea.update({
      where: {
        area_id_producto_id: {
          area_id: inv.area_id,
          producto_id: inv.producto_id
        }
      },
      data: {
        stock: new Decimal(20)
      }
    });
  }

  console.log('--- LIMPIEZA COMPLETADA CON ÉXITO ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

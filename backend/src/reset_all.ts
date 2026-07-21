import prisma from './db';

async function main() {
  console.log('Iniciando vaciado completo de transacciones, socios, cadis y turnos...');
  
  await prisma.$transaction(async (tx) => {
    await tx.divisionCuenta.deleteMany({});
    await tx.detalleCuenta.deleteMany({});
    await tx.cuenta.deleteMany({});
    await tx.movimientoInventario.deleteMany({});
    await tx.asignacionCadiCliente.deleteMany({});
    await tx.cliente.deleteMany({});
    await tx.cadi.deleteMany({});
    await tx.retiroCaja.deleteMany({});
    await tx.turno.deleteMany({});
  });
  
  console.log('¡Base de datos reiniciada con éxito! Socios, Cadis, Cuentas y Turnos vaciados.');
}

main()
  .catch((e) => {
    console.error('Error al reiniciar base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

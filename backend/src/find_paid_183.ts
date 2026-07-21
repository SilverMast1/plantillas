import prisma from './db';

async function findPaid() {
  // Buscar cuentas pagadas de 183
  const cuentas = await prisma.cuenta.findMany({
    where: {
      estado: 'PAGADA',
      total: 183
    },
    include: {
      turno: true
    }
  });

  // Buscar divisiones pagadas de 183
  const divisiones = await prisma.divisionCuenta.findMany({
    where: {
      estado_pago: 'PAGADO',
      monto_proporcional: 183
    },
    include: {
      cliente: true,
      cuenta: true
    }
  });

  console.log('=== CUENTAS PAGADAS DE $183 ===');
  cuentas.forEach(c => {
    console.log(`Cuenta ID: ${c.id}, Referencia: ${c.nombre_referencia}, Metodo: ${c.metodo_pago}, Turno: ${c.turno_id}, Fecha: ${c.closed_at}`);
  });

  console.log('\n=== DIVISIONES PAGADAS DE $183 ===');
  divisiones.forEach(d => {
    console.log(`División ID: ${d.id}, Socio: ${d.cliente.nombre}, Cuenta ID: ${d.cuenta_id}, Metodo: ${d.metodo_pago}, Turno Pago: ${d.turno_pago_id}`);
  });
}

findPaid().catch(console.error);

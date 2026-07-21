import prisma from './db';

async function checkTurno16() {
  const turnoId = 16;
  const accounts = await prisma.cuenta.findMany({
    where: { turno_id: turnoId },
    include: {
      divisionesCuentas: { include: { cliente: true } }
    }
  });

  console.log(`=== CUENTAS DEL TURNO 16 ===`);
  for (const c of accounts) {
    console.log(`Cuenta ID: ${c.id}, Referencia: ${c.nombre_referencia || '—'}, Estado: ${c.estado}, Total: ${c.total}, Método Pago: ${c.metodo_pago}, Ef: ${c.monto_efectivo}, Tj: ${c.monto_tarjeta}`);
    if (c.divisionesCuentas.length > 0) {
      for (const d of c.divisionesCuentas) {
        console.log(`  - Division: Socio ${d.cliente.nombre}, Monto ${d.monto_proporcional}, Metodo ${d.metodo_pago}, Turno Pago ${d.turno_pago_id}`);
      }
    }
  }

  const divPagadas = await prisma.divisionCuenta.findMany({
    where: { turno_pago_id: turnoId },
    include: { cliente: true, cuenta: true }
  });

  console.log(`\n=== DIVISIONES DE OTROS TURNOS PAGADAS EN EL TURNO 16 ===`);
  for (const dp of divPagadas) {
    console.log(`Div ID: ${dp.id}, Socio: ${dp.cliente.nombre}, Monto: ${dp.monto_proporcional}, Metodo: ${dp.metodo_pago}, Cuenta Original ID: ${dp.cuenta_id}, Turno Cuenta Original: ${dp.cuenta.turno_id}`);
  }
}

checkTurno16().catch(console.error);

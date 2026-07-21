import prisma from './db';

async function checkTurno() {
  const turnoId = 13;
  const turno = await prisma.turno.findUnique({
    where: { id: turnoId },
    include: {
      cuentas: {
        include: {
          divisionesCuentas: {
            include: {
              cliente: true
            }
          },
          detalleCuentas: {
            include: {
              producto: true
            }
          }
        }
      },
      retiros: true,
    }
  });

  if (!turno) {
    console.log(`Turno ${turnoId} no encontrado`);
    return;
  }

  console.log('=== TURNO DETALLES ===');
  console.log(`ID: ${turno.id}`);
  console.log(`Fondo Inicial: ${turno.fondo_inicial}`);
  console.log(`Caja Efectivo (Guardada al cerrar): ${turno.caja_efectivo}`);
  console.log(`Caja Tarjeta (Guardada al cerrar): ${turno.caja_tarjeta}`);
  console.log(`Caja Cargos (Guardada al cerrar): ${turno.caja_cargos}`);
  console.log(`Caja Transferencia (Guardada al cerrar): ${turno.caja_transferencia}`);

  let totalCuentasSum = 0;
  console.log('\n--- CUENTAS EN ESTE TURNO ---');
  for (const c of turno.cuentas) {
    console.log(`Cuenta ID: ${c.id}, Referencia: ${c.nombre_referencia || '—'}, Estado: ${c.estado}, Total: ${c.total}, Metodo Pago: ${c.metodo_pago}, Efectivo: ${c.monto_efectivo}, Tarjeta: ${c.monto_tarjeta}`);
    totalCuentasSum += Number(c.total);
    if (c.divisionesCuentas.length > 0) {
      console.log('  Divisiones:');
      for (const div of c.divisionesCuentas) {
        console.log(`    Socio: ${div.cliente.nombre}, Monto: ${div.monto_proporcional}, Metodo: ${div.metodo_pago}, Estado Pago: ${div.estado_pago}, Turno Pago: ${div.turno_pago_id}`);
      }
    }
  }
  console.log(`\nSuma total de cuentas de este turno: ${totalCuentasSum}`);

  // divisiones pagadas en este turno (con turno_pago_id = 13)
  const divPagadas = await prisma.divisionCuenta.findMany({
    where: { turno_pago_id: turnoId },
    include: {
      cliente: true,
      cuenta: true
    }
  });
  console.log('\n--- DIVISIONES DE OTROS TURNOS PAGADAS EN ESTE TURNO ---');
  for (const dp of divPagadas) {
    console.log(`Div ID: ${dp.id}, Socio: ${dp.cliente.nombre}, Monto: ${dp.monto_proporcional}, Metodo: ${dp.metodo_pago}, Cuenta Original ID: ${dp.cuenta_id}, Turno Cuenta: ${dp.cuenta.turno_id}`);
  }
}

checkTurno().catch(err => console.error(err));

import prisma from './db';

async function checkActive() {
  const activeShift = await prisma.turno.findFirst({
    where: { activo: true },
    include: {
      cuentas: {
        include: {
          divisionesCuentas: { include: { cliente: true } }
        }
      },
      retiros: true,
      divisiones_pagadas: {
        include: { cliente: true, cuenta: true }
      }
    }
  });

  if (!activeShift) {
    console.log('No hay un turno activo en este momento.');
    return;
  }

  console.log('=== DETALLES DEL TURNO ACTIVO ===');
  console.log(`ID del Turno: ${activeShift.id}`);
  console.log(`Fondo Inicial: $${activeShift.fondo_inicial}`);
  console.log(`Área ID: ${activeShift.area_id}`);
  console.log(`Abierto el: ${activeShift.abierto_at}`);

  console.log('\n--- CUENTAS ASOCIADAS A ESTE TURNO ---');
  let sumaCuentas = 0;
  for (const c of activeShift.cuentas) {
    console.log(`Cuenta ID: ${c.id}, Referencia: ${c.nombre_referencia || '—'}, Estado: ${c.estado}, Total: ${c.total}, Método Pago: ${c.metodo_pago}, Ef: ${c.monto_efectivo}, Tj: ${c.monto_tarjeta}`);
    sumaCuentas += Number(c.total);
    if (c.divisionesCuentas.length > 0) {
      console.log('  Divisiones:');
      for (const d of c.divisionesCuentas) {
        console.log(`    Socio: ${d.cliente.nombre}, Monto: ${d.monto_proporcional}, Metodo: ${d.metodo_pago}, Estado: ${d.estado_pago}, Turno Pago: ${d.turno_pago_id}`);
      }
    }
  }

  console.log('\n--- DIVISIONES DE OTROS TURNOS PAGADAS EN ESTE TURNO ---');
  for (const dp of activeShift.divisiones_pagadas) {
    console.log(`Div ID: ${dp.id}, Socio: ${dp.cliente.nombre}, Monto: ${dp.monto_proporcional}, Metodo: ${dp.metodo_pago}, Cuenta Original ID: ${dp.cuenta_id}, Turno Cuenta: ${dp.cuenta.turno_id}`);
  }

  console.log('\n--- RETIROS / INGRESOS ---');
  let totalIngresos = 0;
  let totalRetiros = 0;
  for (const r of activeShift.retiros) {
    console.log(`Registro ID: ${r.id}, Tipo: ${r.tipo}, Monto: $${r.monto}, Motivo: ${r.motivo}`);
    if (r.tipo === 'INGRESO') totalIngresos += Number(r.monto);
    else totalRetiros += Number(r.monto);
  }

  // Calculating expected cash balance in drawer
  // Wait, let's see how much efectivo sales we have in the active shift
  let efectivoVentas = 0;
  activeShift.cuentas.forEach(cuenta => {
    if (cuenta.estado === 'PAGADA') {
      if (cuenta.divisionesCuentas.length > 0) {
        cuenta.divisionesCuentas.forEach(div => {
          if (!div.turno_pago_id) {
            if (div.metodo_pago === 'EFECTIVO') efectivoVentas += Number(div.monto_proporcional);
            else if (div.metodo_pago === 'MIXTO') efectivoVentas += Number(div.monto_efectivo);
          }
        });
      } else {
        if (cuenta.metodo_pago === 'EFECTIVO') efectivoVentas += Number(cuenta.total);
        else if (cuenta.metodo_pago === 'MIXTO') efectivoVentas += Number(cuenta.monto_efectivo);
      }
    }
  });

  // Add divisions paid in this shift
  let efectivoDivisionesPagadas = 0;
  activeShift.divisiones_pagadas.forEach(div => {
    if (div.metodo_pago === 'EFECTIVO') efectivoDivisionesPagadas += Number(div.monto_proporcional);
  });

  const totalEfectivoVentas = efectivoVentas + efectivoDivisionesPagadas;
  const cajaEsperada = Number(activeShift.fondo_inicial) + totalEfectivoVentas + totalIngresos - totalRetiros;

  console.log('\n--- BALANCE CALCULADO ---');
  console.log(`Fondo Inicial: $${activeShift.fondo_inicial}`);
  console.log(`Ventas en Efectivo (Cuentas + Divisiones): $${totalEfectivoVentas}`);
  console.log(`Total Ingresos Adicionales: $${totalIngresos}`);
  console.log(`Total Retiros Adicionales: $${totalRetiros}`);
  console.log(`Caja Físcia Esperada (Total en Caja): $${cajaEsperada}`);
}

checkActive().catch(console.error);

import prisma from './db';

async function findCombinations() {
  const activeShift = await prisma.turno.findFirst({
    where: { activo: true },
    include: {
      cuentas: {
        where: { estado: 'PAGADA' },
        include: { divisionesCuentas: true }
      },
      divisiones_pagadas: true
    }
  });

  if (!activeShift) {
    console.log('No hay turno activo.');
    return;
  }

  // Coleccionar todos los montos individuales pagados en efectivo hoy
  const pagosEfectivo: { label: string, monto: number }[] = [];

  activeShift.cuentas.forEach(c => {
    if (c.divisionesCuentas.length > 0) {
      c.divisionesCuentas.forEach(d => {
        if (!d.turno_pago_id && d.metodo_pago === 'EFECTIVO') {
          pagosEfectivo.push({ label: `División ${d.id} (${c.nombre_referencia})`, monto: Number(d.monto_proporcional) });
        }
      });
    } else if (c.metodo_pago === 'EFECTIVO') {
      pagosEfectivo.push({ label: `Cuenta ${c.id} (${c.nombre_referencia})`, monto: Number(c.total) });
    }
  });

  activeShift.divisiones_pagadas.forEach(d => {
    if (d.metodo_pago === 'EFECTIVO') {
      pagosEfectivo.push({ label: `Adeudo liquidado div ${d.id}`, monto: Number(d.monto_proporcional) });
    }
  });

  console.log('=== PAGOS EN EFECTIVO HOY ===');
  pagosEfectivo.forEach(p => console.log(` - ${p.label}: $${p.monto}`));

  // Algoritmo de suma de subconjuntos para encontrar combinaciones que sumen exactamente 183
  const target = 183;
  const results: { label: string, monto: number }[][] = [];

  function helper(index: number, currentSum: number, currentSet: { label: string, monto: number }[]) {
    if (currentSum === target) {
      results.push([...currentSet]);
      return;
    }
    if (currentSum > target || index >= pagosEfectivo.length) {
      return;
    }
    // Incluir elemento actual
    currentSet.push(pagosEfectivo[index]);
    helper(index + 1, currentSum + pagosEfectivo[index].monto, currentSet);
    currentSet.pop();

    // Excluir elemento actual
    helper(index + 1, currentSum, currentSet);
  }

  helper(0, 0, []);

  console.log(`\n=== COMBINACIONES QUE SUMAN EXACTAMENTE $${target} ===`);
  if (results.length === 0) {
    console.log('No hay combinaciones de cobros en efectivo que sumen exactamente esa cantidad.');
  } else {
    results.forEach((r, idx) => {
      console.log(`Combinación #${idx + 1}:`);
      r.forEach(item => console.log(`  * ${item.label}: $${item.monto}`));
    });
  }
}

findCombinations().catch(console.error);

import prisma from './db';

async function checkAllActive() {
  const activeShifts = await prisma.turno.findMany({
    where: { activo: true },
    include: {
      cuentas: {
        where: { estado: 'PAGADA' },
        include: {
          divisionesCuentas: { include: { cliente: true } }
        }
      },
      retiros: true,
      divisiones_pagadas: { include: { cliente: true } }
    }
  });

  console.log(`Hay ${activeShifts.length} turnos activos.`);
  for (const shift of activeShifts) {
    console.log(`\nTurno ID: ${shift.id}, Área: ${shift.area_id === 1 ? 'Bar' : shift.area_id === 2 ? 'Snack' : 'Palapa'}, Fondo: ${shift.fondo_inicial}`);
    let ef = 0;
    shift.cuentas.forEach(c => {
      if (c.divisionesCuentas.length > 0) {
        c.divisionesCuentas.forEach(d => {
          if (!d.turno_pago_id) {
            if (d.metodo_pago === 'EFECTIVO') ef += Number(d.monto_proporcional);
            else if (d.metodo_pago === 'MIXTO') ef += Number(d.monto_efectivo);
          }
        });
      } else {
        if (c.metodo_pago === 'EFECTIVO') ef += Number(c.total);
        else if (c.metodo_pago === 'MIXTO') ef += Number(c.monto_efectivo);
      }
    });

    shift.divisiones_pagadas.forEach(d => {
      if (d.metodo_pago === 'EFECTIVO') ef += Number(d.monto_proporcional);
    });

    const ing = shift.retiros.filter(r => r.tipo === 'INGRESO').reduce((a, b) => a + Number(b.monto), 0);
    const ret = shift.retiros.filter(r => r.tipo !== 'INGRESO').reduce((a, b) => a + Number(b.monto), 0);
    const caja = Number(shift.fondo_inicial) + ef + ing - ret;

    console.log(`  Ventas Efectivo: $${ef}`);
    console.log(`  Ingresos: $${ing}, Retiros: $${ret}`);
    console.log(`  Total en Caja (Esperado): $${caja}`);
  }
}

checkAllActive().catch(console.error);

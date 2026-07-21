import prisma from './db';
import { Decimal } from 'decimal.js';

async function verify() {
  const t = await prisma.turno.findUnique({
    where: { id: 13 },
    include: { retiros: true }
  });

  if (!t) {
    console.log('Turno 13 no encontrado');
    return;
  }

  const fondo = new Decimal(t.fondo_inicial);
  const cajaEfectivoTotal = new Decimal(t.caja_efectivo);
  
  const retirosOnly = t.retiros ? t.retiros.filter(r => r.tipo !== 'INGRESO') : [];
  const ingresosOnly = t.retiros ? t.retiros.filter(r => r.tipo === 'INGRESO') : [];
  const totalRetiros = retirosOnly.reduce((sum, r) => sum.plus(new Decimal(r.monto)), new Decimal(0));
  const totalIngresos = ingresosOnly.reduce((sum, r) => sum.plus(new Decimal(r.monto)), new Decimal(0));

  const efectivoVendido = Decimal.max(0, cajaEfectivoTotal.minus(fondo).minus(totalIngresos).plus(totalRetiros));
  const tarjeta = new Decimal(t.caja_tarjeta);
  const cargos = new Decimal(t.caja_cargos);
  const transferencia = new Decimal(t.caja_transferencia || 0);
  const ventasNetas = efectivoVendido.plus(tarjeta).plus(cargos).plus(transferencia);

  console.log('=== VERIFICACIÓN API CORTE TURNO 13 ===');
  console.log(`Fondo Inicial: $${fondo.toNumber()}`);
  console.log(`Caja Efectivo Total: $${cajaEfectivoTotal.toNumber()}`);
  console.log(`Total Ingresos Adicionales: $${totalIngresos.toNumber()}`);
  console.log(`Total Retiros Adicionales: $${totalRetiros.toNumber()}`);
  console.log(`Efectivo Ventas Calculado: $${efectivoVendido.toNumber()}`);
  console.log(`Tarjeta Ventas: $${tarjeta.toNumber()}`);
  console.log(`Cargos Socios: $${cargos.toNumber()}`);
  console.log(`Ventas Netas Totales del Turno: $${ventasNetas.toNumber()}`);
}

verify().catch(console.error);

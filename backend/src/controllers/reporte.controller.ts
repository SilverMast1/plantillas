import { Response } from 'express';
import { Decimal } from 'decimal.js';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 1. Obtener reporte de ventas por rango (diario, semanal, mensual) en huso local
export async function obtenerReporteDiario(req: AuthenticatedRequest, res: Response) {
  const fechaStr = req.query.fecha as string; // YYYY-MM-DD
  const rango = (req.query.rango as string) || 'diario';

  if (!fechaStr) {
    return res.status(400).json({ error: 'La fecha es requerida (formato YYYY-MM-DD)' });
  }

  try {
    // Determinar inicio y fin en la zona horaria local del servidor
    const [year, month, day] = fechaStr.split('-').map(Number);
    let inicioDia: Date;
    let finDia: Date;

    if (rango === 'semanal') {
      const baseDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dayOfWeek = baseDate.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      inicioDia = new Date(baseDate);
      inicioDia.setDate(baseDate.getDate() + diffToMonday);

      finDia = new Date(inicioDia);
      finDia.setDate(inicioDia.getDate() + 6);
      finDia.setHours(23, 59, 59, 999);
    } else if (rango === 'mensual') {
      inicioDia = new Date(year, month - 1, 1, 0, 0, 0, 0);
      finDia = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // diario (local timezone instead of UTC)
      inicioDia = new Date(year, month - 1, day, 0, 0, 0, 0);
      finDia = new Date(year, month - 1, day, 23, 59, 59, 999);
    }

    // Buscar cuentas pagadas en ese rango de fecha
    const cuentas = await prisma.cuenta.findMany({
      where: {
        estado: 'PAGADA',
        closed_at: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      include: {
        area: true,
        usuario: { select: { nombre: true } },
        detalleCuentas: { include: { producto: true } },
        divisionesCuentas: { include: { cliente: true } },
      },
      orderBy: { closed_at: 'desc' },
    });

    let efectivo = new Decimal(0);
    let tarjeta = new Decimal(0);
    let cargos = new Decimal(0);
    let transferencia = new Decimal(0);
    let totalVentas = new Decimal(0);
    let totalDescuentos = new Decimal(0);

    const ventas = cuentas.map((c) => {
      const items = c.detalleCuentas.map(det => `${Number(det.cantidad)}x ${det.producto.nombre}`);
      const pagos: any[] = [];
      const totalCuenta = new Decimal(c.total);
      totalDescuentos = totalDescuentos.plus(new Decimal(c.descuento || 0));

      if (c.divisionesCuentas.length > 0) {
        let sumaDivisiones = new Decimal(0);
        c.divisionesCuentas.forEach(div => {
          const montoDec = new Decimal(div.monto_proporcional);
          const metodo = div.metodo_pago;

          if (metodo === 'CARGO_SOCIO') {
            cargos = cargos.plus(montoDec);
          } else if (!div.turno_pago_id) {
            if (metodo === 'EFECTIVO') efectivo = efectivo.plus(montoDec);
            else if (metodo === 'TARJETA') tarjeta = tarjeta.plus(montoDec);
            else if (metodo === 'TRANSFERENCIA') transferencia = transferencia.plus(montoDec);
            else if (metodo === 'MIXTO') {
              efectivo = efectivo.plus(new Decimal(div.monto_efectivo || 0));
              tarjeta = tarjeta.plus(new Decimal(div.monto_tarjeta || 0));
            }
          }

          sumaDivisiones = sumaDivisiones.plus(montoDec);

          pagos.push({
            nombre: div.cliente.nombre + (div.turno_pago_id ? ' (Pagado después)' : ''),
            monto: Number(montoDec),
            metodo,
          });
        });

        // Abono Directo (si hay diferencia y se especificó método de pago en la cuenta)
        if (c.metodo_pago && totalCuenta.greaterThan(sumaDivisiones)) {
          const dif = totalCuenta.minus(sumaDivisiones);
          if (c.metodo_pago === 'EFECTIVO') efectivo = efectivo.plus(dif);
          else if (c.metodo_pago === 'TARJETA') tarjeta = tarjeta.plus(dif);
          else if (c.metodo_pago === 'TRANSFERENCIA') transferencia = transferencia.plus(dif);
          else if (c.metodo_pago === 'MIXTO') {
            efectivo = efectivo.plus(new Decimal(c.monto_efectivo || 0));
            tarjeta = tarjeta.plus(new Decimal(c.monto_tarjeta || 0));
          }

          pagos.push({
            nombre: 'Abono Directo',
            monto: Number(dif),
            metodo: c.metodo_pago,
          });
        }
      } else if (c.metodo_pago) {
        const metodo = c.metodo_pago;
        if (metodo === 'EFECTIVO') efectivo = efectivo.plus(totalCuenta);
        else if (metodo === 'TARJETA') tarjeta = tarjeta.plus(totalCuenta);
        else if (metodo === 'TRANSFERENCIA') transferencia = transferencia.plus(totalCuenta);
        else if (metodo === 'CARGO_SOCIO') cargos = cargos.plus(totalCuenta);
        else if (metodo === 'MIXTO') {
          efectivo = efectivo.plus(new Decimal(c.monto_efectivo || 0));
          tarjeta = tarjeta.plus(new Decimal(c.monto_tarjeta || 0));
        }

        pagos.push({
          nombre: 'Pago directo',
          monto: Number(totalCuenta),
          metodo,
        });
      }

      return {
        id: c.id.toString(),
        fecha: c.closed_at,
        area: c.area.nombre,
        atendido_por: c.usuario.nombre,
        total: Number(totalCuenta),
        descuento: Number(c.descuento || 0),
        items,
        pagos,
      };
    });

    // Divisiones de socios liquidadas en este periodo (pagos de cargos anteriores)
    const divisionesPagadasHoy = await prisma.divisionCuenta.findMany({
      where: {
        estado_pago: 'PAGADO',
        pagado_at: {
          gte: inicioDia,
          lte: finDia,
        },
        turno_pago_id: { not: null },
      },
      include: {
        cliente: true,
        cuenta: { select: { id: true, closed_at: true } },
      }
    });

    // Acumular liquidaciones por separado para no inflar los métodos de pago de ventas
    let liquidadoEfectivo = new Decimal(0);
    let liquidadoTarjeta = new Decimal(0);
    let liquidadoTransferencia = new Decimal(0);
    let totalLiquidado = new Decimal(0);

    divisionesPagadasHoy.forEach(div => {
      const montoDec = new Decimal(div.monto_proporcional);
      const metodo = div.metodo_pago;
      totalLiquidado = totalLiquidado.plus(montoDec);

      if (metodo === 'EFECTIVO') {
        efectivo = efectivo.plus(montoDec);
        liquidadoEfectivo = liquidadoEfectivo.plus(montoDec);
      }
      else if (metodo === 'TARJETA') {
        tarjeta = tarjeta.plus(montoDec);
        liquidadoTarjeta = liquidadoTarjeta.plus(montoDec);
      }
      else if (metodo === 'TRANSFERENCIA') {
        transferencia = transferencia.plus(montoDec);
        liquidadoTransferencia = liquidadoTransferencia.plus(montoDec);
      }
    });

    // Ventas Netas = suma real de todos los métodos de pago (lo que realmente entró/se cargó)
    totalVentas = efectivo.plus(tarjeta).plus(transferencia).plus(cargos);

    return res.json({
      fecha: fechaStr,
      rango,
      fecha_inicio: inicioDia,
      fecha_fin: finDia,
      resumen: {
        efectivo: efectivo.toNumber(),
        tarjeta: tarjeta.toNumber(),
        transferencia: transferencia.toNumber(),
        cargo_socio: cargos.toNumber(),
        total_descuentos: totalDescuentos.toNumber(),
        total_ventas: totalVentas.toNumber(),
        // Desglose de liquidaciones de socios (pagos de cargos de periodos anteriores)
        total_liquidado_socios: totalLiquidado.toNumber(),
        liquidado_efectivo: liquidadoEfectivo.toNumber(),
        liquidado_tarjeta: liquidadoTarjeta.toNumber(),
        liquidado_transferencia: liquidadoTransferencia.toNumber(),
      },
      ventas,
      cargos_liquidados: divisionesPagadasHoy.map(div => ({
        id: div.id,
        socio: div.cliente.nombre,
        cuenta_id: div.cuenta_id,
        monto: Number(div.monto_proporcional),
        metodo_pago: div.metodo_pago,
        fecha: div.pagado_at,
      })),
    });
  } catch (error: any) {
    console.error('Error al generar reporte diario:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener reporte diario' });
  }
}

// 2. Obtener historial de turnos cerrados (arqueos/cortes de caja)
export async function obtenerReporteCortes(req: AuthenticatedRequest, res: Response) {
  try {
    const turnos = await prisma.turno.findMany({
      include: {
        usuario: { select: { nombre: true } },
        retiros: true,
      },
      orderBy: { abierto_at: 'desc' },
    });

    const resultado = turnos.map((t) => {
      const fondo = new Decimal(t.fondo_inicial);
      const cajaEfectivoTotal = new Decimal(t.caja_efectivo); // Incluye el fondo
      
      const retirosOnly = t.retiros ? t.retiros.filter(r => r.tipo !== 'INGRESO') : [];
      const ingresosOnly = t.retiros ? t.retiros.filter(r => r.tipo === 'INGRESO') : [];
      const totalRetiros = retirosOnly.reduce((sum, r) => sum.plus(new Decimal(r.monto)), new Decimal(0));
      const totalIngresos = ingresosOnly.reduce((sum, r) => sum.plus(new Decimal(r.monto)), new Decimal(0));

      const efectivoVendido = t.activo 
        ? new Decimal(0) 
        : Decimal.max(0, cajaEfectivoTotal.minus(fondo).minus(totalIngresos).plus(totalRetiros));

      const tarjeta = new Decimal(t.caja_tarjeta);
      const cargos = new Decimal(t.caja_cargos);
      const transferencia = new Decimal(t.caja_transferencia || 0);
      const ventasNetas = t.activo 
        ? new Decimal(0)
        : efectivoVendido.plus(tarjeta).plus(cargos).plus(transferencia);

      return {
        id: t.id,
        activo: t.activo,
        atendido_por: t.usuario.nombre,
        abierto_at: t.abierto_at,
        cerrado_at: t.cerrado_at,
        fondo_inicial: Number(fondo),
        efectivo_total_caja: Number(cajaEfectivoTotal), // Fondo + Efectivo vendido + ingresos - retiros
        efectivo_ventas: Number(efectivoVendido),
        tarjeta_ventas: Number(tarjeta),
        transferencia_ventas: Number(transferencia),
        cargos_socios: Number(cargos),
        ventas_netas: Number(ventasNetas), // Total vendido en el turno
        total_retiros: Number(totalRetiros),
        total_ingresos: Number(totalIngresos),
        retiros: t.retiros ? t.retiros.map(r => ({
          id: r.id,
          monto: Number(r.monto),
          motivo: r.motivo,
          tipo: r.tipo || 'RETIRO',
          fecha: r.created_at,
        })) : [],
      };
    });

    return res.json(resultado);
  } catch (error: any) {
    console.error('Error al obtener reporte de cortes:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener reporte de cortes' });
  }
}

/**
 * Obtener ventas por área para los últimos N días (para dashboard)
 */
export async function obtenerVentasPorArea(req: AuthenticatedRequest, res: Response) {
  try {
    const dias = parseInt(req.query.dias as string) || 7;
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (dias - 1), 0, 0, 0, 0);

    const cuentas = await prisma.cuenta.findMany({
      where: {
        estado: 'PAGADA',
        closed_at: { gte: inicio },
      },
      include: { area: true },
      orderBy: { closed_at: 'asc' },
    });

    const areas = new Map<string, { nombre: string; color: string; porDia: Map<string, number> }>();
    const coloresArea: Record<string, string> = {
      'Palapa': '#c5a059',
      'Bar': '#3b82f6',
      'Snack': '#10b981',
    };

    cuentas.forEach(cuenta => {
      if (!cuenta.closed_at) return;
      const areaNombre = cuenta.area.nombre;
      const dia = cuenta.closed_at.toISOString().split('T')[0];
      const total = parseFloat(cuenta.total.toString());
      if (!areas.has(areaNombre)) {
        areas.set(areaNombre, { nombre: areaNombre, color: coloresArea[areaNombre] || '#94a3b8', porDia: new Map() });
      }
      const area = areas.get(areaNombre)!;
      area.porDia.set(dia, (area.porDia.get(dia) || 0) + total);
    });

    const dias_array: string[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      dias_array.push(d.toISOString().split('T')[0]);
    }

    const resultado = Array.from(areas.values()).map(area => ({
      nombre: area.nombre,
      color: area.color,
      datos: dias_array.map(dia => ({ fecha: dia, total: area.porDia.get(dia) || 0 })),
    }));

    const totales = Array.from(areas.values()).map(area => ({
      nombre: area.nombre,
      color: area.color,
      total: Array.from(area.porDia.values()).reduce((a, b) => a + b, 0),
    }));

    return res.json({ dias: dias_array, series: resultado, totales });
  } catch (error) {
    console.error('Error al obtener ventas por área:', error);
    return res.status(500).json({ error: 'Error al consultar ventas por área' });
  }
}

import { Response } from 'express';
import { Decimal } from 'decimal.js';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Registrar un gasto o ingreso
export async function registrarGastoIngreso(req: AuthenticatedRequest, res: Response) {
  const { fecha, tipo_registro, concepto, monto, metodo_pago } = req.body;

  if (!fecha || !tipo_registro || !concepto || monto === undefined || !metodo_pago) {
    return res.status(400).json({ error: 'Todos los campos son requeridos: fecha, tipo_registro, concepto, monto, metodo_pago' });
  }

  try {
    const registro = await prisma.gastoIngresoCCL.create({
      data: {
        fecha: new Date(fecha),
        tipo_registro,
        concepto,
        monto: new Decimal(monto),
        metodo_pago
      }
    });

    return res.status(201).json(registro);
  } catch (error: any) {
    console.error('Error al registrar gasto/ingreso:', error);
    return res.status(500).json({ error: error.message || 'Error al guardar el registro' });
  }
}

// Eliminar un gasto o ingreso
export async function eliminarGastoIngreso(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await prisma.gastoIngresoCCL.delete({
      where: { id }
    });
    return res.json({ message: 'Registro eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar registro:', error);
    return res.status(500).json({ error: error.message || 'Error al eliminar el registro' });
  }
}

// Obtener reporte semanal y lista de registros
export async function obtenerReporteSemanalGastos(req: AuthenticatedRequest, res: Response) {
  const fechaStr = req.query.fecha as string; // Fecha base para determinar la semana (YYYY-MM-DD)

  if (!fechaStr) {
    return res.status(400).json({ error: 'La fecha es requerida' });
  }

  try {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day);
    const dayOfWeek = baseDate.getDay(); // 0: domingo, 1: lunes...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const inicioSemana = new Date(baseDate);
    inicioSemana.setDate(baseDate.getDate() + diffToMonday);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    // Buscar registros en el rango de la semana
    const registros = await prisma.gastoIngresoCCL.findMany({
      where: {
        fecha: {
          gte: inicioSemana,
          lte: finSemana
        }
      },
      orderBy: { fecha: 'asc' }
    });

    // Inicializar acumuladores decimales
    let totalGastosFijos = new Decimal(0);
    let totalGastosVariables = new Decimal(0);
    let totalGastosMateriales = new Decimal(0);

    let ingresoEfectivo = new Decimal(0);
    let ingresoIzettle = new Decimal(0);
    let ingresoBanregio = new Decimal(0);

    let egresoEfectivo = new Decimal(0);
    let egresoIzettle = new Decimal(0);
    let egresoBanregio = new Decimal(0);

    const desglose = registros.map((r) => {
      const monto = new Decimal(r.monto);

      if (r.tipo_registro === 'INGRESO') {
        if (r.metodo_pago === 'EFECTIVO') ingresoEfectivo = ingresoEfectivo.plus(monto);
        else if (r.metodo_pago === 'IZETTLE') ingresoIzettle = ingresoIzettle.plus(monto);
        else if (r.metodo_pago === 'BANREGIO') ingresoBanregio = ingresoBanregio.plus(monto);
      } else {
        // Es un gasto (GASTO_FIJO, GASTO_VARIABLE, GASTO_MATERIAL)
        if (r.tipo_registro === 'GASTO_FIJO') totalGastosFijos = totalGastosFijos.plus(monto);
        else if (r.tipo_registro === 'GASTO_VARIABLE') totalGastosVariables = totalGastosVariables.plus(monto);
        else if (r.tipo_registro === 'GASTO_MATERIAL') totalGastosMateriales = totalGastosMateriales.plus(monto);

        // Agrupar salidas por canal de pago
        if (r.metodo_pago === 'EFECTIVO') egresoEfectivo = egresoEfectivo.plus(monto);
        else if (r.metodo_pago === 'IZETTLE') egresoIzettle = egresoIzettle.plus(monto);
        else if (r.metodo_pago === 'BANREGIO') egresoBanregio = egresoBanregio.plus(monto);
      }

      return {
        id: r.id,
        fecha: r.fecha,
        tipo_registro: r.tipo_registro,
        concepto: r.concepto,
        monto: monto.toNumber(),
        metodo_pago: r.metodo_pago
      };
    });

    // Calcular cierres
    const cierreEfectivo = ingresoEfectivo.minus(egresoEfectivo);
    const cierreIzettle = ingresoIzettle.minus(egresoIzettle);
    const cierreBanregio = ingresoBanregio.minus(egresoBanregio);
    const cierreCaja = ingresoEfectivo.plus(ingresoIzettle).plus(ingresoBanregio);
    const totalSemanal = cierreEfectivo.plus(cierreIzettle).plus(cierreBanregio);

    return res.json({
      inicio_semana: inicioSemana,
      fin_semana: finSemana,
      registros: desglose,
      sumario: {
        gastos_fijos: totalGastosFijos.toNumber(),
        gastos_variables: totalGastosVariables.toNumber(),
        gastos_materiales: totalGastosMateriales.toNumber(),
        ingreso_efectivo: ingresoEfectivo.toNumber(),
        ingreso_izettle: ingresoIzettle.toNumber(),
        ingreso_banregio: ingresoBanregio.toNumber(),
        egreso_efectivo: egresoEfectivo.toNumber(),
        egreso_izettle: egresoIzettle.toNumber(),
        egreso_banregio: egresoBanregio.toNumber(),
        cierre_caja: cierreCaja.toNumber(),
        cierre_semanal_efectivo: cierreEfectivo.toNumber(),
        cierre_semanal_izettle: cierreIzettle.toNumber(),
        cierre_semanal_banregio: cierreBanregio.toNumber(),
        total_semanal: totalSemanal.toNumber()
      }
    });
  } catch (error: any) {
    console.error('Error al generar reporte de gastos:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener reporte' });
  }
}

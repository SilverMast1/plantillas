import { Response } from 'express';
import { Decimal } from 'decimal.js';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 1. Obtener productos y stock de un área específica (Bar, Snack, Palapa)

async function gestionarStock(tx: any, areaId: number, productoId: number, cantidadDiff: any, usuarioId: number, cuentaId: number) {
  if (cantidadDiff.isZero()) return;

  const prod = await tx.producto.findUnique({ where: { id: productoId } });
  if (!prod) throw new Error(`Producto con ID ${productoId} no encontrado`);

  const nombreProd = prod.nombre.trim().toLowerCase();

  if (cantidadDiff.greaterThan(0)) {
    // SALIDA DE INVENTARIO (Descontar stock)
    let cantidadPorDescontar = cantidadDiff;

    if (nombreProd === 'agua mineral prep') {
      const prodGrande = await tx.producto.findFirst({ where: { nombre: { equals: 'Agua Mineral Grande' } } });
      const prodNormal = await tx.producto.findFirst({ where: { nombre: { equals: 'Agua Mineral' } } });

      if (prodGrande) {
        const invGrande = await tx.inventarioArea.findUnique({ where: { area_id_producto_id: { area_id: areaId, producto_id: prodGrande.id } } });
        if (invGrande && cantidadPorDescontar.greaterThan(0)) {
          const stockGrandeActual = invGrande.stock; // Decimal
          const prepsDisponiblesGrande = stockGrandeActual.mul(3);
          const prepsADescontarGrande = cantidadPorDescontar.lessThan(prepsDisponiblesGrande) ? cantidadPorDescontar : prepsDisponiblesGrande;

          if (prepsADescontarGrande.greaterThan(0)) {
            const descontarGrandeStock = prepsADescontarGrande.div(3).toDP(2);
            const nuevoStockGrande = stockGrandeActual.minus(descontarGrandeStock);
            await tx.inventarioArea.update({ where: { area_id_producto_id: { area_id: areaId, producto_id: prodGrande.id } }, data: { stock: nuevoStockGrande } });
            await tx.movimientoInventario.create({ data: { area_id: areaId, producto_id: prodGrande.id, tipo_movimiento: 'SALIDA_VENTA', cantidad: descontarGrandeStock, stock_anterior: stockGrandeActual, stock_nuevo: nuevoStockGrande, usuario_id: usuarioId, referencia_id: `CUENTA-${cuentaId}`, motivo: 'Consumo (cascada)' } });
            cantidadPorDescontar = cantidadPorDescontar.minus(prepsADescontarGrande);
          }
        }
      }

      if (cantidadPorDescontar.greaterThan(0)) {
        if (!prodNormal) throw new Error(`No se encontró Agua Mineral`);
        const invNormal = await tx.inventarioArea.findUnique({ where: { area_id_producto_id: { area_id: areaId, producto_id: prodNormal.id } } });
        if (!invNormal) throw new Error(`El producto Agua Mineral no está en esta área`);
        const stockNormalActual = invNormal.stock;
        if (stockNormalActual.lessThan(cantidadPorDescontar)) throw new Error(`Stock insuficiente para Agua Mineral Prep`);
        const nuevoStockNormal = stockNormalActual.minus(cantidadPorDescontar);
        await tx.inventarioArea.update({ where: { area_id_producto_id: { area_id: areaId, producto_id: prodNormal.id } }, data: { stock: nuevoStockNormal } });
        await tx.movimientoInventario.create({ data: { area_id: areaId, producto_id: prodNormal.id, tipo_movimiento: 'SALIDA_VENTA', cantidad: cantidadPorDescontar, stock_anterior: stockNormalActual, stock_nuevo: nuevoStockNormal, usuario_id: usuarioId, referencia_id: `CUENTA-${cuentaId}`, motivo: 'Consumo' } });
      }
    } else {
      const inv = await tx.inventarioArea.findUnique({ where: { area_id_producto_id: { area_id: areaId, producto_id: productoId } } });
      if (!inv) throw new Error(`Producto ${prod.nombre} no registrado en el inventario de esta área`);
      const stockActual = inv.stock;
      if (stockActual.lessThan(cantidadDiff)) throw new Error(`Stock insuficiente para ${prod.nombre}. Disp: ${stockActual}, Req: ${cantidadDiff}`);
      const nuevoStock = stockActual.minus(cantidadDiff);
      await tx.inventarioArea.update({ where: { area_id_producto_id: { area_id: areaId, producto_id: productoId } }, data: { stock: nuevoStock } });
      await tx.movimientoInventario.create({ data: { area_id: areaId, producto_id: productoId, tipo_movimiento: 'SALIDA_VENTA', cantidad: cantidadDiff, stock_anterior: stockActual, stock_nuevo: nuevoStock, usuario_id: usuarioId, referencia_id: `CUENTA-${cuentaId}`, motivo: 'Consumo registrado por POS' } });
    }

    // Insumos
    const recetaIngredientes = await tx.recetaIngrediente.findMany({ where: { producto_id: productoId } });
    for (const receta of recetaIngredientes) {
      const insumo = await tx.insumo.findUnique({ where: { id: receta.insumo_id } });
      if (insumo) {
        const stockInsumoActual = insumo.stock;
        const cantidadRestarInsumo = receta.cantidad.mul(cantidadDiff);
        const nuevoStockInsumo = stockInsumoActual.minus(cantidadRestarInsumo);
        await tx.insumo.update({ where: { id: receta.insumo_id }, data: { stock: nuevoStockInsumo } });
      }
    }

  } else {
    // ENTRADA DE INVENTARIO (Devolución)
    let cantidadPorDevolver = cantidadDiff.abs();
    
    if (nombreProd === 'agua mineral prep') {
      const prodNormal = await tx.producto.findFirst({ where: { nombre: { equals: 'Agua Mineral' } } });
      if (prodNormal) {
        const invNormal = await tx.inventarioArea.findUnique({ where: { area_id_producto_id: { area_id: areaId, producto_id: prodNormal.id } } });
        if (invNormal) {
          const stockNormalActual = invNormal.stock;
          const nuevoStockNormal = stockNormalActual.plus(cantidadPorDevolver);
          await tx.inventarioArea.update({ where: { area_id_producto_id: { area_id: areaId, producto_id: prodNormal.id } }, data: { stock: nuevoStockNormal } });
          await tx.movimientoInventario.create({ data: { area_id: areaId, producto_id: prodNormal.id, tipo_movimiento: 'ENTRADA_DEVOLUCION', cantidad: cantidadPorDevolver, stock_anterior: stockNormalActual, stock_nuevo: nuevoStockNormal, usuario_id: usuarioId, referencia_id: `CUENTA-${cuentaId}`, motivo: 'Devolución (Agua Mineral Prep)' } });
        }
      }
    } else {
      const inv = await tx.inventarioArea.findUnique({ where: { area_id_producto_id: { area_id: areaId, producto_id: productoId } } });
      if (inv) {
        const stockActual = inv.stock;
        const nuevoStock = stockActual.plus(cantidadPorDevolver);
        await tx.inventarioArea.update({ where: { area_id_producto_id: { area_id: areaId, producto_id: productoId } }, data: { stock: nuevoStock } });
        await tx.movimientoInventario.create({ data: { area_id: areaId, producto_id: productoId, tipo_movimiento: 'ENTRADA_DEVOLUCION', cantidad: cantidadPorDevolver, stock_anterior: stockActual, stock_nuevo: nuevoStock, usuario_id: usuarioId, referencia_id: `CUENTA-${cuentaId}`, motivo: 'Devolución por modificación POS' } });
      }
    }

    // Devolver Insumos
    const recetaIngredientes = await tx.recetaIngrediente.findMany({ where: { producto_id: productoId } });
    for (const receta of recetaIngredientes) {
      const insumo = await tx.insumo.findUnique({ where: { id: receta.insumo_id } });
      if (insumo) {
        const stockInsumoActual = insumo.stock;
        const cantidadSumarInsumo = receta.cantidad.mul(cantidadPorDevolver);
        const nuevoStockInsumo = stockInsumoActual.plus(cantidadSumarInsumo);
        await tx.insumo.update({ where: { id: receta.insumo_id }, data: { stock: nuevoStockInsumo } });
      }
    }
  }
}


export async function listarProductosPorArea(req: AuthenticatedRequest, res: Response) {
  const areaId = parseInt(req.params.areaId);

  if (isNaN(areaId)) {
    return res.status(400).json({ error: 'ID de área inválido' });
  }

  try {
    const productosConStock = await prisma.inventarioArea.findMany({
      where: { area_id: areaId, producto: { activo: true } },
      include: {
        producto: true,
      },
    });

    // Formatear la respuesta
    const productos = productosConStock.map((inv) => ({
      id: inv.producto.id,
      codigo_barras: inv.producto.codigo_barras,
      nombre: inv.producto.nombre,
      descripcion: inv.producto.descripcion,
      precio_venta: Number(inv.producto.precio_venta),
      categoria: inv.producto.categoria,
      stock: Number(inv.stock),
      stock_minimo: Number(inv.stock_minimo),
      stock_maximo: Number(inv.stock_maximo),
      ubicacion_estante: inv.ubicacion_estante,
    }));

    return res.json(productos);
  } catch (error) {
    console.error('Error al listar productos por área:', error);
    return res.status(500).json({ error: 'Error al consultar inventario' });
  }
}

// 2. Abrir una nueva cuenta
export async function abrirCuenta(req: AuthenticatedRequest, res: Response) {
  const { area_id, cadi_id, nombre_referencia, cliente_id } = req.body;
  const usuarioId = req.user?.id;

  if (!area_id || !usuarioId) {
    return res.status(400).json({ error: 'El área e ID de usuario son requeridos' });
  }

  try {
    const turnoActivo = await prisma.turno.findFirst({
      where: { activo: true, area_id: parseInt(area_id) },
      orderBy: { abierto_at: 'desc' },
    });

    const nuevaCuenta = await prisma.cuenta.create({
      data: {
        area_id: parseInt(area_id),
        usuario_id: usuarioId,
        turno_id: turnoActivo?.id,
        cadi_id: cadi_id ? parseInt(cadi_id) : null,
        cliente_id: cliente_id ? parseInt(cliente_id) : null,
        nombre_referencia,
        estado: 'ABIERTA',
        subtotal: new Decimal(0),
        impuestos: new Decimal(0),
        descuento: new Decimal(0),
        total: new Decimal(0),
      },
      include: {
        cadi: true,
        cliente: true,
      },
    });

    return res.status(201).json(nuevaCuenta);
  } catch (error) {
    console.error('Error al abrir la cuenta:', error);
    return res.status(500).json({ error: 'Error al abrir la cuenta' });
  }
}

// 3. Registrar consumos (guardar cuenta abierta / actualizar detalles)
export async function guardarConsumos(req: AuthenticatedRequest, res: Response) {
  const cuentaId = parseInt(req.params.cuentaId);
  const { productos, cadi_id, nombre_referencia, cliente_id, descuento_empleado, dejar_abierta } = req.body; // Array de { producto_id, cantidad }

  if (!Array.isArray(productos)) {
    return res.status(400).json({ error: 'Los productos deben ser enviados como un arreglo' });
  }

  try {
    const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
    const esAdmin = req.user?.roles?.includes('ADMIN') || false;
    if (!cuenta || (cuenta.estado !== 'ABIERTA' && (!esAdmin || cuenta.estado !== 'PAGADA'))) {
      return res.status(404).json({ error: 'La cuenta no existe, ya está cerrada, o no tiene permisos de administrador para editarla.' });
    }

    const usuarioId = req.user?.id || 1; // Fallback admin if needed

    // Usaremos una transacción para recrear los detalles e imputar subtotales
    const cuentaActualizada = await prisma.$transaction(async (tx) => {
      // Determinar si hay otro consumo en Snack, Bar, Palapa para el mismo socio y juntar las cuentas
      const finalClienteId = cliente_id !== undefined ? (cliente_id ? Number(cliente_id) : null) : cuenta.cliente_id;
      let otraCuenta: any = null;
      let detallesOtra: any[] = [];

      if ((dejar_abierta === true || dejar_abierta === 'true') && finalClienteId && [1, 2, 3].includes(cuenta.area_id)) {
        otraCuenta = await tx.cuenta.findFirst({
          where: {
            id: { not: cuentaId },
            cliente_id: finalClienteId,
            estado: 'ABIERTA',
            area_id: { in: [1, 2, 3] }
          },
          include: {
            detalleCuentas: true
          }
        });
        if (otraCuenta) {
          detallesOtra = otraCuenta.detalleCuentas;
        }
      }

      // 1. Obtener detalles previos para calcular diferencia de stock
      const detallesPrevios = await tx.detalleCuenta.findMany({ where: { cuenta_id: cuentaId } });
      const prevQtys: Record<number, any> = {};
      for (const dp of detallesPrevios) {
        if (!prevQtys[dp.producto_id]) prevQtys[dp.producto_id] = new Decimal(0);
        prevQtys[dp.producto_id] = prevQtys[dp.producto_id].plus(new Decimal(dp.cantidad));
      }

      if (otraCuenta) {
        for (const dp of detallesOtra) {
          if (!prevQtys[dp.producto_id]) prevQtys[dp.producto_id] = new Decimal(0);
          prevQtys[dp.producto_id] = prevQtys[dp.producto_id].plus(new Decimal(dp.cantidad));
        }
      }

      const productosFinales = [...productos];
      if (otraCuenta) {
        const areaActual = cuenta.area_id === 1 ? 'Bar' : cuenta.area_id === 2 ? 'Snack' : 'Palapa';
        const areaOrigen = otraCuenta.area_id === 1 ? 'Bar' : otraCuenta.area_id === 2 ? 'Snack' : 'Palapa';

        // Etiquetar los consumos nuevos/existentes de la cuenta actual con su área de origen
        for (let i = 0; i < productosFinales.length; i++) {
          const tag = `(${areaActual})`;
          if (!productosFinales[i].notas || !productosFinales[i].notas.includes(tag)) {
            productosFinales[i].notas = productosFinales[i].notas 
              ? `${productosFinales[i].notas} ${tag}`
              : tag;
          }
        }

        // Fusionar consumos de la otra cuenta
        for (const dp of detallesOtra) {
          const areaNota = `(${areaOrigen})`;
          const notaLimpia = dp.notas ? `${dp.notas} ${areaNota}` : areaNota;

          const index = productosFinales.findIndex(p => p.producto_id === dp.producto_id);
          if (index !== -1) {
            productosFinales[index].cantidad = Number(productosFinales[index].cantidad) + Number(dp.cantidad);
            productosFinales[index].notas = productosFinales[index].notas 
              ? `${productosFinales[index].notas} | ${notaLimpia}`
              : notaLimpia;
          } else {
            productosFinales.push({
              producto_id: dp.producto_id,
              cantidad: Number(dp.cantidad),
              precio_unitario: Number(dp.precio_unitario),
              notas: notaLimpia
            });
          }
        }
      }

      const newQtys: Record<number, any> = {};
      for (const p of productosFinales) {
        if (!newQtys[p.producto_id]) newQtys[p.producto_id] = new Decimal(0);
        newQtys[p.producto_id] = newQtys[p.producto_id].plus(new Decimal(p.cantidad));
      }

      const allProdIds = new Set([...Object.keys(prevQtys).map(Number), ...Object.keys(newQtys).map(Number)]);
      
      for (const prodId of allProdIds) {
        const prev = prevQtys[prodId] || new Decimal(0);
        const cur = newQtys[prodId] || new Decimal(0);
        const diff = cur.minus(prev);
        
        await gestionarStock(tx, cuenta.area_id, prodId, diff, usuarioId, cuenta.id);
      }

      // Eliminar detalles previos de la cuenta
      await tx.detalleCuenta.deleteMany({ where: { cuenta_id: cuentaId } });
      if (otraCuenta) {
        await tx.detalleCuenta.deleteMany({ where: { cuenta_id: otraCuenta.id } });
        await tx.cuenta.update({
          where: { id: otraCuenta.id },
          data: {
            estado: 'FUSIONADA',
            subtotal: 0,
            descuento: 0,
            impuestos: 0,
            total: 0
          }
        });
      }

      let subtotalAcumulado = new Decimal(0);

      // 2. Crear nuevos detalles
      for (const p of productosFinales) {
        const prod = await tx.producto.findUnique({ where: { id: p.producto_id } });
        if (!prod) {
          throw new Error(`Producto con ID ${p.producto_id} no encontrado`);
        }

        const cantidadDec = new Decimal(p.cantidad);
        const precioDec = p.precio_unitario !== undefined && p.precio_unitario !== null
          ? new Decimal(p.precio_unitario)
          : new Decimal(prod.precio_venta);
        const itemSubtotal = cantidadDec.mul(precioDec);

        subtotalAcumulado = subtotalAcumulado.plus(itemSubtotal);

        await tx.detalleCuenta.create({
          data: {
            cuenta_id: cuentaId,
            producto_id: prod.id,
            cantidad: cantidadDec,
            precio_unitario: precioDec,
            descuento: new Decimal(0),
            subtotal: itemSubtotal,
            total: itemSubtotal,
            estado_item: 'ENTREGADO',
            notas: p.notas || null,
          },
        });
      }

      // 3. Si tiene descuento global del 30%, se calcula sobre el subtotal acumulado
      const tieneDescuentoGlobal = descuento_empleado === true || descuento_empleado === 'true';
      const descuentoAcumulado = tieneDescuentoGlobal ? subtotalAcumulado.mul(0.30).toDP(2) : new Decimal(0);
      const totalDec = subtotalAcumulado.minus(descuentoAcumulado);
      const impuestos = new Decimal(0);

      // Actualizar cuenta madre
      const updateData: any = {
        subtotal: subtotalAcumulado,
        descuento: descuentoAcumulado,
        impuestos,
        total: totalDec,
      };

      if (cadi_id !== undefined) {
        updateData.cadi_id = cadi_id ? Number(cadi_id) : null;
      }
      if (cliente_id !== undefined) {
        updateData.cliente_id = cliente_id ? Number(cliente_id) : null;
      }
      if (nombre_referencia !== undefined) {
        updateData.nombre_referencia = nombre_referencia;
      }

      if (cuenta.estado === 'PAGADA') {
        const divisiones = await tx.divisionCuenta.findMany({ where: { cuenta_id: cuentaId } });
        for (const div of divisiones) {
          const porcentaje = new Decimal(div.porcentaje_participacion);
          const nuevoMonto = totalDec.mul(porcentaje).div(100).toDP(2);
          await tx.divisionCuenta.update({
            where: { id: div.id },
            data: {
              monto_proporcional: nuevoMonto
            }
          });
        }
      }

      return await tx.cuenta.update({
        where: { id: cuentaId },
        data: updateData,
        include: {
          detalleCuentas: {
            include: {
              producto: true,
            },
          },
          cadi: true,
          cliente: true,
        },
      });
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('cuenta:actualizar');
    }

    return res.json(cuentaActualizada);
  } catch (error: any) {
    console.error('Error al guardar consumos:', error);
    return res.status(500).json({ error: error.message || 'Error al actualizar consumos' });
  }
}

// 4. Previsualizar la división (Split) de la cuenta vinculada al Cadi
export async function previsualizarSplit(req: AuthenticatedRequest, res: Response) {
  const cuentaId = parseInt(req.params.cuentaId);

  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      include: {
        detalleCuentas: { include: { producto: true } },
        cadi: true,
      },
    });

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    const totalCuenta = new Decimal(cuenta.total);

    // Si no tiene cadi, no hay split automático por Cadi, se cobra directo al cliente
    if (!cuenta.cadi_id) {
      return res.json({
        split_automatico: false,
        total: totalCuenta.toNumber(),
        divisiones: [],
      });
    }

    // Obtener los socios activos vinculados al Cadi
    const asignaciones = await prisma.asignacionCadiCliente.findMany({
      where: { cadi_id: cuenta.cadi_id, activa: true },
      include: { cliente: true },
    });

    const cantidadClientes = asignaciones.length;

    if (cantidadClientes === 0) {
      return res.json({
        split_automatico: true,
        total: totalCuenta.toNumber(),
        cadi: cuenta.cadi?.nombre,
        mensaje: 'El Cadi no tiene clientes activos asignados en esta ronda',
        divisiones: [],
      });
    }

    // Cálculo del Split con precisión decimal exacta y ajuste de residuo
    const porcentajeBase = new Decimal(100).div(cantidadClientes);
    const montoBase = totalCuenta.div(cantidadClientes).toDP(2); // Redondear a 2 decimales para dinero

    // Sumamos los montos redondeados para ver si hay residuo decimal
    let totalDividido = montoBase.mul(cantidadClientes);
    let residuo = totalCuenta.minus(totalDividido);

    const divisiones = asignaciones.map((asig, index) => {
      let montoCliente = new Decimal(montoBase);
      // Aplicar el residuo remanente al último cliente para que sume exactamente el total
      if (index === cantidadClientes - 1 && !residuo.isZero()) {
        montoCliente = montoCliente.plus(residuo);
      }

      return {
        cliente_id: asig.cliente.id,
        nombre: asig.cliente.nombre,
        codigo_socio: asig.cliente.codigo_socio,
        porcentaje: porcentajeBase.toNumber(),
        monto: montoCliente.toNumber(),
      };
    });

    return res.json({
      split_automatico: true,
      total: totalCuenta.toNumber(),
      cadi: cuenta.cadi?.nombre,
      divisiones,
    });
  } catch (error) {
    console.error('Error al previsualizar split:', error);
    return res.status(500).json({ error: 'Error al calcular la división' });
  }
}

// 5. Cobrar y cerrar la cuenta con descuento de stock (Transaccional)
// Soporta 2 modos:
//   a) Pago Directo: body = { metodo_pago: 'EFECTIVO' | 'TARJETA' } — sin socios/divisiones
//   b) Pago Split:   body = { pagos: [{ cliente_id, monto, metodo_pago }] } — con socios
export async function pagarYCerrarCuenta(req: AuthenticatedRequest, res: Response) {
  const cuentaId = parseInt(req.params.cuentaId);
  const { pagos, metodo_pago, abono, cliente_id, monto_efectivo, monto_tarjeta } = req.body;
  const usuarioId = req.user?.id;

  const esPagoDirecto = metodo_pago && (!pagos || pagos.length === 0) && abono === undefined;
  const esPagoSplit = Array.isArray(pagos) && pagos.length > 0;
  const esPagoAbonoCargo = abono !== undefined && cliente_id !== undefined;

  if (!esPagoDirecto && !esPagoSplit && !esPagoAbonoCargo) {
    return res.status(400).json({ error: 'Debe especificar un método de pago, los pagos divididos por socio o el abono con cargo a socio' });
  }

  if (!usuarioId) {
    return res.status(400).json({ error: 'Usuario requerido' });
  }

  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      include: {
        detalleCuentas: true,
      },
    });

    if (!cuenta || cuenta.estado !== 'ABIERTA') {
      return res.status(400).json({ error: 'La cuenta no existe o ya ha sido pagada/cancelada' });
    }

    // Ejecutar cobro y descuento en transacción atómica
    await prisma.$transaction(async (tx) => {
      if (esPagoDirecto) {
        // 2a. Pago Directo — cerrar la cuenta con el método de pago indicado (sin divisiones)
        if (metodo_pago === 'MIXTO') {
          if (monto_efectivo === undefined || monto_tarjeta === undefined) {
            throw new Error('Debe especificar el monto en efectivo y en tarjeta para pago mixto');
          }
          const totalCuenta = new Decimal(cuenta.total);
          const efDec = new Decimal(monto_efectivo);
          const tjDec = new Decimal(monto_tarjeta);
          if (!efDec.plus(tjDec).toDP(2).equals(totalCuenta.toDP(2))) {
            throw new Error(`La suma de efectivo ($${efDec.toNumber()}) y tarjeta ($${tjDec.toNumber()}) no coincide con el total ($${totalCuenta.toNumber()})`);
          }
          await tx.cuenta.update({
            where: { id: cuentaId },
            data: {
              estado: 'PAGADA',
              closed_at: new Date(),
              metodo_pago: 'MIXTO',
              monto_efectivo: efDec,
              monto_tarjeta: tjDec,
            },
          });
        } else {
          await tx.cuenta.update({
            where: { id: cuentaId },
            data: {
              estado: 'PAGADA',
              closed_at: new Date(),
              metodo_pago: metodo_pago,
              monto_efectivo: metodo_pago === 'EFECTIVO' ? cuenta.total : 0,
              monto_tarjeta: metodo_pago === 'TARJETA' ? cuenta.total : 0,
            },
          });
        }
      } else if (esPagoAbonoCargo) {
        // 2c. Pago con Abono y Cargo Socio
        const totalCuenta = new Decimal(cuenta.total);
        const abonoDec = new Decimal(abono);

        if (abonoDec.lessThan(0)) {
          throw new Error('El abono no puede ser menor a cero');
        }
        if (abonoDec.greaterThan(totalCuenta)) {
          throw new Error('El abono no puede ser mayor al total de la cuenta');
        }

        const cargoSocioMonto = totalCuenta.minus(abonoDec);
        const porcentajeCargo = cargoSocioMonto.div(totalCuenta).mul(100);

        if (cargoSocioMonto.greaterThan(0)) {
          await tx.divisionCuenta.create({
            data: {
              cuenta_id: cuentaId,
              cliente_id: cliente_id,
              porcentaje_participacion: porcentajeCargo,
              monto_proporcional: cargoSocioMonto,
              metodo_pago: 'CARGO_SOCIO',
              estado_pago: 'PENDIENTE',
              pagado_at: null,
            },
          });
        }

        // Registrar el abono en el metodo_pago de la cuenta
        if (metodo_pago === 'MIXTO') {
          if (monto_efectivo === undefined || monto_tarjeta === undefined) {
            throw new Error('Debe especificar el monto en efectivo y en tarjeta para pago mixto');
          }
          const efDec = new Decimal(monto_efectivo);
          const tjDec = new Decimal(monto_tarjeta);
          if (!efDec.plus(tjDec).toDP(2).equals(abonoDec.toDP(2))) {
            throw new Error(`La suma de efectivo ($${efDec.toNumber()}) y tarjeta ($${tjDec.toNumber()}) no coincide con el abono ($${abonoDec.toNumber()})`);
          }
          await tx.cuenta.update({
            where: { id: cuentaId },
            data: {
              estado: 'PAGADA',
              closed_at: new Date(),
              metodo_pago: 'MIXTO',
              monto_efectivo: efDec,
              monto_tarjeta: tjDec,
            },
          });
        } else {
          await tx.cuenta.update({
            where: { id: cuentaId },
            data: {
              estado: 'PAGADA',
              closed_at: new Date(),
              metodo_pago: metodo_pago || 'EFECTIVO',
              monto_efectivo: (metodo_pago || 'EFECTIVO') === 'EFECTIVO' ? abonoDec : 0,
              monto_tarjeta: (metodo_pago || 'EFECTIVO') === 'TARJETA' ? abonoDec : 0,
            },
          });
        }
      } else {
        // 2b. Pago Split — registrar los pagos divisionales de los socios
        const totalCuenta = new Decimal(cuenta.total);
        let sumaPagos = new Decimal(0);

        for (const pago of pagos) {
          const montoDec = new Decimal(pago.monto);
          sumaPagos = sumaPagos.plus(montoDec);

          const porcentaje = montoDec.div(totalCuenta).mul(100);

          const esCargoSocio = pago.metodo_pago === 'CARGO_SOCIO';
          const esMixto = pago.metodo_pago === 'MIXTO';

          let efDec = new Decimal(0);
          let tjDec = new Decimal(0);

          if (esMixto) {
            if (pago.monto_efectivo === undefined || pago.monto_tarjeta === undefined) {
              throw new Error('Debe especificar el monto en efectivo y en tarjeta para el pago mixto del socio');
            }
            efDec = new Decimal(pago.monto_efectivo);
            tjDec = new Decimal(pago.monto_tarjeta);
            if (!efDec.plus(tjDec).toDP(2).equals(montoDec.toDP(2))) {
              throw new Error(`La suma de efectivo ($${efDec.toNumber()}) y tarjeta ($${tjDec.toNumber()}) no coincide con el total proporcional del socio ($${montoDec.toNumber()})`);
            }
          } else if (pago.metodo_pago === 'EFECTIVO') {
            efDec = montoDec;
          } else if (pago.metodo_pago === 'TARJETA') {
            tjDec = montoDec;
          }

          await tx.divisionCuenta.create({
            data: {
              cuenta_id: cuentaId,
              cliente_id: pago.cliente_id,
              porcentaje_participacion: porcentaje,
              monto_proporcional: montoDec,
              metodo_pago: pago.metodo_pago,
              monto_efectivo: efDec,
              monto_tarjeta: tjDec,
              estado_pago: esCargoSocio ? 'PENDIENTE' : 'PAGADO',
              pagado_at: esCargoSocio ? null : new Date(),
            },
          });
        }

        // Validar que la suma de los pagos coincida exactamente con el total de la cuenta
        if (!sumaPagos.toDP(2).equals(totalCuenta.toDP(2))) {
          throw new Error(`La suma de los pagos ($${sumaPagos.toNumber()}) no coincide con el total de la cuenta ($${totalCuenta.toNumber()})`);
        }

        // 3. Cerrar y actualizar estado de la cuenta
        await tx.cuenta.update({
          where: { id: cuentaId },
          data: {
            estado: 'PAGADA',
            closed_at: new Date(),
          },
        });
      }
    });

    // Si la cuenta tenía un cadi asignado, opcionalmente se puede liberar al cadi a 'DISPONIBLE'
    if (cuenta.cadi_id) {
      // Validar si el cadi tiene más asignaciones activas. Si no, se libera.
      const otrasAsignaciones = await prisma.asignacionCadiCliente.findMany({
        where: { cadi_id: cuenta.cadi_id, activa: true },
      });
      if (otrasAsignaciones.length === 0) {
        await prisma.cadi.update({
          where: { id: cuenta.cadi_id },
          data: { estado: 'DISPONIBLE' },
        });
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('cuenta:actualizar');
    }

    return res.json({ message: 'Cuenta pagada y cerrada exitosamente' });
  } catch (error: any) {
    console.error('Error al procesar el pago de la cuenta:', error);
    return res.status(500).json({ error: error.message || 'Error en el proceso de cobro' });
  }
}

// 6. Ajustar Stock Físico Manualmente (Solo Administradores)
export async function ajustarStockArea(req: AuthenticatedRequest, res: Response) {
  const { area_id, producto_id, nuevo_stock, motivo, nombre, precio_venta } = req.body;
  const usuarioId = req.user?.id;

  if (!area_id || !producto_id || nuevo_stock === undefined || !usuarioId) {
    return res.status(400).json({ error: 'Área, producto, nuevo stock y usuario administrador requeridos' });
  }

  try {
    const areaIdInt = parseInt(area_id);
    const productoIdInt = parseInt(producto_id);
    const nuevoStockDec = new Decimal(nuevo_stock);

    if (nuevoStockDec.lessThan(0)) {
      return res.status(400).json({ error: 'El stock no puede ser menor a cero' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // Si se especificó nombre o precio_venta, actualizarlos en el Producto
      const dataUpdateProducto: any = {};
      if (nombre !== undefined && nombre.trim() !== '') {
        dataUpdateProducto.nombre = nombre.trim();
      }
      if (precio_venta !== undefined && precio_venta !== null) {
        const precioDec = new Decimal(precio_venta);
        if (precioDec.lessThan(0)) {
          throw new Error('El precio de venta no puede ser menor a cero');
        }
        dataUpdateProducto.precio_venta = precioDec;
      }

      if (Object.keys(dataUpdateProducto).length > 0) {
        await tx.producto.update({
          where: { id: productoIdInt },
          data: dataUpdateProducto,
        });
      }

      // Obtener stock actual
      const inv = await tx.inventarioArea.findUnique({
        where: {
          area_id_producto_id: {
            area_id: areaIdInt,
            producto_id: productoIdInt,
          },
        },
      });

      if (!inv) {
        throw new Error('El producto no está registrado en el inventario de esta área');
      }

      const stockAnterior = new Decimal(inv.stock);

      // Actualizar stock
      const invActualizado = await tx.inventarioArea.update({
        where: {
          area_id_producto_id: {
            area_id: areaIdInt,
            producto_id: productoIdInt,
          },
        },
        data: {
          stock: nuevoStockDec,
        },
        include: {
          producto: true,
        },
      });

      // Crear movimiento de inventario (Kardex)
      await tx.movimientoInventario.create({
        data: {
          area_id: areaIdInt,
          producto_id: productoIdInt,
          tipo_movimiento: 'AJUSTE',
          cantidad: nuevoStockDec.minus(stockAnterior), // Diferencia (puede ser positiva o negativa)
          stock_anterior: stockAnterior,
          stock_nuevo: nuevoStockDec,
          usuario_id: usuarioId,
          referencia_id: 'AJUSTE-MANUAL',
          motivo: motivo || 'Ajuste manual por administrador',
        },
      });

      return invActualizado;
    }, { timeout: 15000 });

    // Notificar cambio de inventario por sockets si el servidor tiene adjunto socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('inventario:actualizar');
    }

    return res.json({
      message: 'Stock y datos de producto ajustados con éxito',
      producto: resultado.producto.nombre,
      area_id: resultado.area_id,
      nuevo_stock: Number(resultado.stock),
      precio_venta: Number(resultado.producto.precio_venta),
    });
  } catch (error: any) {
    console.error('Error al ajustar stock:', error);
    return res.status(500).json({ error: error.message || 'Error al ajustar el inventario' });
  }
}

// Helper para verificar si dos fechas son del mismo día de calendario
function esMismoDia(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

// 7. Listar todas las cuentas (Admin)
export async function listarTodasLasCuentas(req: AuthenticatedRequest, res: Response) {
  try {
    const { solo_turno_activo } = req.query;
    let whereClause: any = {};

    if (solo_turno_activo === 'true') {
      const turnosActivos = await prisma.turno.findMany({
        where: { activo: true },
      });

      const turnosValidos = turnosActivos.filter(t => esMismoDia(new Date(), new Date(t.abierto_at)));

      if (turnosValidos.length === 0) {
        return res.json([]);
      }

      whereClause.turno_id = { in: turnosValidos.map(t => t.id) };
    }

    const cuentas = await prisma.cuenta.findMany({
      where: whereClause,
      include: {
        area: true,
        usuario: { select: { nombre: true } },
        cadi: {
          include: {
            asignaciones: {
              where: { activa: true },
              include: {
                cliente: true,
              },
            },
          },
        },
        cliente: true,
        detalleCuentas: { include: { producto: true } },
        divisionesCuentas: { include: { cliente: { select: { id: true, nombre: true, codigo_socio: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });

    const resultado = cuentas.map((c) => ({
      id: c.id.toString(),
      area_id: c.area.id,
      area: c.area.nombre,
      referencia: c.nombre_referencia || '—',
      estado: c.estado,
      total: Number(c.total),
      metodo_pago: c.metodo_pago,
      fecha: c.created_at,
      cerrado_at: c.closed_at,
      usuario_id: c.usuario_id,
      atendido_por: c.usuario.nombre,
      cadi_id: c.cadi_id,
      cadi: c.cadi ? `${c.cadi.numero_cadi} - ${c.cadi.nombre}` : null,
      socios: c.cadi 
        ? c.cadi.asignaciones.map((a) => ({
            id: a.cliente.id,
            nombre: a.cliente.nombre,
            codigo_socio: a.cliente.codigo_socio,
            email: a.cliente.email,
          }))
        : c.cliente ? [{
            id: c.cliente.id,
            nombre: c.cliente.nombre,
            codigo_socio: c.cliente.codigo_socio,
            email: c.cliente.email,
          }] : [],
      productos: c.detalleCuentas.map((d) => ({
        id: d.producto.id,
        nombre: d.producto.nombre,
        precio_venta: Number(d.precio_unitario),
        categoria: d.producto.categoria,
        cantidad: Number(d.cantidad),
        subtotal: Number(d.subtotal),
        notas: d.notas || null,
      })),
      divisiones: c.divisionesCuentas.map((d) => ({
        cliente: d.cliente.nombre,
        codigo_socio: d.cliente.codigo_socio,
        monto: Number(d.monto_proporcional),
        metodo_pago: d.metodo_pago,
        estado_pago: d.estado_pago,
      })),
    }));

    return res.json(resultado);
  } catch (error) {
    console.error('Error al listar cuentas:', error);
    return res.status(500).json({ error: 'Error al consultar cuentas' });
  }
}

// 8. Eliminar una cuenta (Admin) — también elimina sus detalles y divisiones
export async function eliminarCuenta(req: AuthenticatedRequest, res: Response) {
  const cuentaId = parseInt(req.params.cuentaId);
  const usuarioId = req.user?.id || 1;

  try {
    const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Obtener detalles de la cuenta (no retornamos productos al inventario para que el stock permanezca descontado)
      // Conforme a solicitud del usuario: "si se llega a borrar una cuenta ya abierta, esta elimine su inventario de stock no que lo restablezca"
      // const detalles = await tx.detalleCuenta.findMany({ where: { cuenta_id: cuentaId } });
      // for (const detalle of detalles) {
      //   const diff = detalle.cantidad.negated();
      //   await gestionarStock(tx, cuenta.area_id, detalle.producto_id, diff, usuarioId, cuentaId);
      // }

      // 3. Eliminar divisiones, detalles y la cuenta
      await tx.divisionCuenta.deleteMany({ where: { cuenta_id: cuentaId } });
      await tx.detalleCuenta.deleteMany({ where: { cuenta_id: cuentaId } });
      await tx.cuenta.delete({ where: { id: cuentaId } });
    });

    return res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar cuenta:', error);
    return res.status(500).json({ error: error.message || 'Error al eliminar la cuenta' });
  }
}

// 9. Reset completo: elimina todas las cuentas, divisiones, detalles y movimientos de inventario
export async function resetearDatos(req: AuthenticatedRequest, res: Response) {
  try {
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

    return res.json({ message: 'Datos reseteados correctamente. Cuentas, movimientos y asignaciones eliminados.' });
  } catch (error: any) {
    console.error('Error al resetear datos:', error);
    return res.status(500).json({ error: error.message || 'Error al resetear los datos' });
  }
}

// 10. Crear nuevo producto con precio personalizado (Admin)
export async function crearProducto(req: AuthenticatedRequest, res: Response) {
  const { nombre, precio_venta, categoria, descripcion, stock_bar, stock_snack, stock_palapa, stock_minimo } = req.body;

  if (!nombre || precio_venta === undefined) {
    return res.status(400).json({ error: 'Nombre y precio de venta son requeridos' });
  }

  const precioNum = parseFloat(precio_venta);
  if (isNaN(precioNum) || precioNum < 0) {
    return res.status(400).json({ error: 'El precio debe ser un número positivo' });
  }

  try {
    const { Decimal } = await import('decimal.js');

    const producto = await prisma.$transaction(async (tx) => {
      // Crear el producto
      const nuevo = await tx.producto.create({
        data: {
          nombre,
          precio_venta: new Decimal(precioNum),
          categoria: categoria || 'General',
          descripcion: descripcion || null,
          activo: true,
        },
      });

      const stockMin = new Decimal(stock_minimo ?? 0);
      const areas = [
        { id: 1, stock: new Decimal(stock_bar ?? 0) },
        { id: 2, stock: new Decimal(stock_snack ?? 0) },
        { id: 3, stock: new Decimal(stock_palapa ?? 0) },
      ];

      // Registrar en inventario de las 3 áreas
      for (const area of areas) {
        await tx.inventarioArea.create({
          data: {
            area_id: area.id,
            producto_id: nuevo.id,
            stock: area.stock,
            stock_minimo: stockMin,
            stock_maximo: new Decimal(999),
          },
        });
      }

      return nuevo;
    });

    return res.status(201).json({
      message: `Producto "${producto.nombre}" creado exitosamente`,
      id: producto.id,
      nombre: producto.nombre,
      precio_venta: Number(producto.precio_venta),
      categoria: producto.categoria,
    });
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ error: error.message || 'Error al crear el producto' });
  }
}

// 11. Obtener balances contables acumulados de caja (Solo Administradores)
// Filtra los pagos asociados al turno activo del área proporcionada.
export async function obtenerBalanceCaja(req: AuthenticatedRequest, res: Response) {
  try {
    const { area_id } = req.query;
    
    if (!area_id) {
      return res.status(400).json({ error: 'Falta proporcionar area_id' });
    }

    const areaIdNum = parseInt(area_id as string);

    // Buscar turno activo del área
    const turno = await prisma.turno.findFirst({
      where: {
        area_id: areaIdNum,
        cerrado_at: null
      },
      select: { id: true, fondo_inicial: true },
      orderBy: { id: 'desc' }
    });

    if (!turno) {
      return res.json({ efectivo: 0, tarjeta: 0, transferencia: 0, cargo_socio: 0 });
    }

    let efectivo = Number(turno.fondo_inicial || 0);
    let tarjeta = 0;
    let transferencia = 0;
    let cargo_socio = 0;

    // 1. Agrupar cuentas directas (sin divisiones) por método de pago
    const directasPorMetodo = await prisma.cuenta.groupBy({
      by: ['metodo_pago'],
      _sum: { total: true },
      where: {
        turno_id: turno.id,
        estado: 'PAGADA',
        divisionesCuentas: { none: {} }
      }
    });

    directasPorMetodo.forEach(group => {
      const total = Number(group._sum.total || 0);
      if (group.metodo_pago === 'EFECTIVO') efectivo += total;
      else if (group.metodo_pago === 'TARJETA') tarjeta += total;
      else if (group.metodo_pago === 'TRANSFERENCIA') transferencia += total;
      else if (group.metodo_pago === 'CARGO_SOCIO') cargo_socio += total;
    });

    // Cuentas mixtas directas
    const directasMixtas = await prisma.cuenta.aggregate({
      _sum: { monto_efectivo: true, monto_tarjeta: true },
      where: {
        turno_id: turno.id,
        estado: 'PAGADA',
        metodo_pago: 'MIXTO',
        divisionesCuentas: { none: {} }
      }
    });
    efectivo += Number(directasMixtas._sum.monto_efectivo || 0);
    tarjeta += Number(directasMixtas._sum.monto_tarjeta || 0);

    // 2. Agrupar divisiones por método de pago
    const splitsPorMetodo = await prisma.divisionCuenta.groupBy({
      by: ['metodo_pago'],
      _sum: { monto_proporcional: true },
      where: {
        cuenta: {
          turno_id: turno.id,
          estado: 'PAGADA'
        },
        turno_pago_id: null
      }
    });

    splitsPorMetodo.forEach(group => {
      const total = Number(group._sum.monto_proporcional || 0);
      if (group.metodo_pago === 'EFECTIVO') efectivo += total;
      else if (group.metodo_pago === 'TARJETA') tarjeta += total;
      else if (group.metodo_pago === 'TRANSFERENCIA') transferencia += total;
      else if (group.metodo_pago === 'CARGO_SOCIO') cargo_socio += total;
    });

    // Divisiones mixtas inmediatas
    const splitsMixtos = await prisma.divisionCuenta.aggregate({
      _sum: { monto_efectivo: true, monto_tarjeta: true },
      where: {
        cuenta: {
          turno_id: turno.id,
          estado: 'PAGADA'
        },
        metodo_pago: 'MIXTO',
        turno_pago_id: null
      }
    });
    efectivo += Number(splitsMixtos._sum.monto_efectivo || 0);
    tarjeta += Number(splitsMixtos._sum.monto_tarjeta || 0);

    // 3. Sumar abonos de divisiones pagadas diferidas en este turno
    const divisionesPagadasDiferidas = await prisma.divisionCuenta.groupBy({
      by: ['metodo_pago'],
      _sum: { monto_proporcional: true },
      where: { turno_pago_id: turno.id }
    });

    divisionesPagadasDiferidas.forEach(group => {
      const total = Number(group._sum.monto_proporcional || 0);
      if (group.metodo_pago === 'EFECTIVO') efectivo += total;
      else if (group.metodo_pago === 'TARJETA') tarjeta += total;
      else if (group.metodo_pago === 'TRANSFERENCIA') transferencia += total;
    });

    // 4. Procesar retiros e ingresos de caja
    const retirosIngresos = await prisma.retiroCaja.groupBy({
      by: ['tipo'],
      _sum: { monto: true },
      where: { turno_id: turno.id }
    });

    retirosIngresos.forEach(group => {
      const total = Number(group._sum.monto || 0);
      if (group.tipo === 'RETIRO') {
        efectivo -= total;
      } else if (group.tipo === 'INGRESO' || group.tipo === 'DEPOSITO') {
        efectivo += total;
      }
    });

    return res.json({ efectivo, tarjeta, transferencia, cargo_socio });
  } catch (error) {
    console.error('Error al obtener balances de caja:', error);
    return res.status(500).json({ error: 'Error al consultar balances contables' });
  }
}

// 12. Actualizar método de pago de una cuenta ya pagada (Efectivo / Tarjeta / Cargo Socio)
export async function actualizarMetodoPagoCuenta(req: AuthenticatedRequest, res: Response) {
  const cuentaId = parseInt(req.params.cuentaId);
  const { metodo_pago, divisiones, monto_efectivo, monto_tarjeta } = req.body; // divisiones = [ { cliente_id: number, metodo_pago: string } ]

  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
    });

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    if (cuenta.estado !== 'PAGADA') {
      return res.status(400).json({ error: 'Solo se puede modificar el método de pago de cuentas ya pagadas' });
    }

    await prisma.$transaction(async (tx) => {
      if (divisiones && Array.isArray(divisiones)) {
        for (const div of divisiones) {
          const esCargoSocio = div.metodo_pago === 'CARGO_SOCIO';
          await tx.divisionCuenta.update({
            where: {
              uq_cuenta_cliente_division: {
                cuenta_id: cuentaId,
                cliente_id: Number(div.cliente_id)
              }
            },
            data: {
              metodo_pago: div.metodo_pago,
              estado_pago: esCargoSocio ? 'PENDIENTE' : 'PAGADO',
              pagado_at: esCargoSocio ? null : new Date(),
            }
          });
        }
      } else if (metodo_pago) {
        let ef = new Decimal(0);
        let tj = new Decimal(0);
        if (metodo_pago === 'EFECTIVO') {
          ef = new Decimal(cuenta.total);
        } else if (metodo_pago === 'TARJETA') {
          tj = new Decimal(cuenta.total);
        } else if (metodo_pago === 'MIXTO') {
          if (monto_efectivo !== undefined && monto_tarjeta !== undefined) {
            ef = new Decimal(monto_efectivo);
            tj = new Decimal(monto_tarjeta);
          } else {
            throw new Error('Debe especificar monto_efectivo y monto_tarjeta para pago mixto');
          }
        }
        await tx.cuenta.update({
          where: { id: cuentaId },
          data: { 
            metodo_pago,
            monto_efectivo: ef,
            monto_tarjeta: tj,
          }
        });
      }
    });

    return res.json({ message: 'Método de pago de la cuenta actualizado correctamente' });
  } catch (error: any) {
    console.error('Error al actualizar método de pago:', error);
    return res.status(500).json({ error: error.message || 'Error al actualizar el método de pago' });
  }
}

// 13. Traspasar stock entre áreas
export async function transferirStock(req: AuthenticatedRequest, res: Response) {
  const { producto_id, origen_area_id, destino_area_id, cantidad, motivo } = req.body;
  const usuarioId = req.user?.id;

  if (!producto_id || !origen_area_id || !destino_area_id || cantidad === undefined || !usuarioId) {
    return res.status(400).json({ error: 'Producto, área de origen, área de destino, cantidad y usuario requeridos' });
  }

  const cantidadDec = new Decimal(cantidad);
  if (cantidadDec.lessThanOrEqualTo(0)) {
    return res.status(400).json({ error: 'La cantidad a traspasar debe ser mayor a cero' });
  }

  const prodId = parseInt(producto_id);
  const origenAreaId = parseInt(origen_area_id);
  const destinoAreaId = parseInt(destino_area_id);

  if (origenAreaId === destinoAreaId) {
    return res.status(400).json({ error: 'El área de origen y destino deben ser diferentes' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener inventario origen
      const invOrigen = await tx.inventarioArea.findUnique({
        where: {
          area_id_producto_id: {
            area_id: origenAreaId,
            producto_id: prodId,
          },
        },
        include: { producto: true },
      });

      if (!invOrigen) {
        throw new Error('El producto no está registrado en el área de origen');
      }

      const stockOrigen = new Decimal(invOrigen.stock);
      if (stockOrigen.lessThan(cantidadDec)) {
        throw new Error(`Stock insuficiente en el área de origen (${invOrigen.producto.nombre}). Disponible: ${stockOrigen.toNumber()}, Requerido: ${cantidadDec.toNumber()}`);
      }

      // 2. Obtener o crear inventario destino
      let invDestino = await tx.inventarioArea.findUnique({
        where: {
          area_id_producto_id: {
            area_id: destinoAreaId,
            producto_id: prodId,
          },
        },
      });

      if (!invDestino) {
        invDestino = await tx.inventarioArea.create({
          data: {
            area_id: destinoAreaId,
            producto_id: prodId,
            stock: new Decimal(0),
            stock_minimo: new Decimal(5),
            stock_maximo: new Decimal(999),
          },
        });
      }

      const stockDestino = new Decimal(invDestino.stock);

      const nuevoStockOrigen = stockOrigen.minus(cantidadDec);
      const nuevoStockDestino = stockDestino.plus(cantidadDec);

      // 3. Actualizar stock en origen
      await tx.inventarioArea.update({
        where: {
          area_id_producto_id: {
            area_id: origenAreaId,
            producto_id: prodId,
          },
        },
        data: { stock: nuevoStockOrigen },
      });

      // 4. Actualizar stock en destino
      await tx.inventarioArea.update({
        where: {
          area_id_producto_id: {
            area_id: destinoAreaId,
            producto_id: prodId,
          },
        },
        data: { stock: nuevoStockDestino },
      });

      // 5. Crear movimiento de inventario para origen (SALIDA)
      await tx.movimientoInventario.create({
        data: {
          area_id: origenAreaId,
          producto_id: prodId,
          tipo_movimiento: 'SALIDA_TRASPASO',
          cantidad: cantidadDec,
          stock_anterior: stockOrigen,
          stock_nuevo: nuevoStockOrigen,
          usuario_id: usuarioId,
          referencia_id: `TRASPASO-A-AREA-${destinoAreaId}`,
          motivo: motivo || `Traspaso a área ID ${destinoAreaId}`,
        },
      });

      // 6. Crear movimiento de inventario para destino (ENTRADA)
      await tx.movimientoInventario.create({
        data: {
          area_id: destinoAreaId,
          producto_id: prodId,
          tipo_movimiento: 'ENTRADA_TRASPASO',
          cantidad: cantidadDec,
          stock_anterior: stockDestino,
          stock_nuevo: nuevoStockDestino,
          usuario_id: usuarioId,
          referencia_id: `TRASPASO-DESDE-AREA-${origenAreaId}`,
          motivo: motivo || `Traspaso desde área ID ${origenAreaId}`,
        },
      });

      return {
        producto: invOrigen.producto.nombre,
        nuevoStockOrigen: nuevoStockOrigen.toNumber(),
        nuevoStockDestino: nuevoStockDestino.toNumber(),
      };
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('inventario:actualizar');
    }

    return res.json({
      message: `Traspaso de stock de "${result.producto}" realizado con éxito`,
      nuevo_stock_origen: result.nuevoStockOrigen,
      nuevo_stock_destino: result.nuevoStockDestino,
    });
  } catch (error: any) {
    console.error('Error al transferir stock:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar el traspaso de stock' });
  }
}

// 14. Listar todos los productos sin importar el área (para administración y recetas)
export async function listarTodosLosProductos(req: AuthenticatedRequest, res: Response) {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    const resultado = productos.map((p) => ({
      id: p.id,
      codigo_barras: p.codigo_barras,
      nombre: p.nombre,
      precio_venta: Number(p.precio_venta),
      categoria: p.categoria,
      activo: p.activo,
    }));

    return res.json(resultado);
  } catch (error) {
    console.error('Error al listar todos los productos:', error);
    return res.status(500).json({ error: 'Error al obtener catálogo de productos' });
  }
}

// 15. Registrar Merma de Stock de un Producto en un Área (Solo Administradores)
export async function registrarMermaStock(req: AuthenticatedRequest, res: Response) {
  const { area_id, producto_id, cantidad, motivo } = req.body;
  const usuarioId = req.user?.id;

  if (!area_id || !producto_id || cantidad === undefined || !usuarioId) {
    return res.status(400).json({ error: 'Área, producto, cantidad a mermar y usuario administrador requeridos' });
  }

  const cantidadMermar = parseFloat(cantidad);
  if (isNaN(cantidadMermar) || cantidadMermar <= 0) {
    return res.status(400).json({ error: 'La cantidad a mermar debe ser un número positivo mayor a cero' });
  }

  try {
    const areaIdInt = parseInt(area_id);
    const productoIdInt = parseInt(producto_id);

    const resultado = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventarioArea.findUnique({
        where: {
          area_id_producto_id: {
            area_id: areaIdInt,
            producto_id: productoIdInt,
          },
        },
        include: {
          producto: true,
        },
      });

      if (!inv) {
        throw new Error('El producto no está registrado en el inventario de esta área');
      }

      const stockActual = new Decimal(inv.stock);
      const cantidadMermarDec = new Decimal(cantidadMermar);

      if (stockActual.lessThan(cantidadMermarDec)) {
        throw new Error(`Stock insuficiente para merma. Disponible: ${stockActual.toNumber()}, Requerido: ${cantidadMermarDec.toNumber()}`);
      }

      const nuevoStock = stockActual.minus(cantidadMermarDec);

      const invActualizado = await tx.inventarioArea.update({
        where: {
          area_id_producto_id: {
            area_id: areaIdInt,
            producto_id: productoIdInt,
          },
        },
        data: {
          stock: nuevoStock,
        },
        include: {
          producto: true,
        },
      });

      await tx.movimientoInventario.create({
        data: {
          area_id: areaIdInt,
          producto_id: productoIdInt,
          tipo_movimiento: 'SALIDA_MERMA',
          cantidad: cantidadMermarDec,
          stock_anterior: stockActual,
          stock_nuevo: nuevoStock,
          usuario_id: usuarioId,
          referencia_id: 'MERMA-MANUAL',
          motivo: motivo || 'Merma de inventario registrada por administrador',
        },
      });

      return invActualizado;
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('inventario:actualizar');
    }

    return res.json({
      message: 'Merma registrada con éxito',
      producto: resultado.producto.nombre,
      area_id: resultado.area_id,
      nuevo_stock: Number(resultado.stock),
      cantidad_mermada: cantidadMermar,
    });
  } catch (error: any) {
    console.error('Error al registrar merma:', error);
    return res.status(500).json({ error: error.message || 'Error al registrar la merma' });
  }
}

export async function listarMermas(req: AuthenticatedRequest, res: Response) {
  try {
    const mermas = await prisma.movimientoInventario.findMany({
      where: { tipo_movimiento: 'SALIDA_MERMA' },
      include: {
        producto: true,
        area: true,
        usuario: { select: { nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    const resultado = mermas.map((m) => ({
      id: m.id.toString(),
      producto: m.producto.nombre,
      area: m.area.nombre,
      cantidad: Number(m.cantidad),
      fecha: m.fecha,
      motivo: m.motivo || 'Sin motivo',
      registrado_por: m.usuario.nombre,
    }));

    return res.json(resultado);
  } catch (error: any) {
    console.error('Error al listar mermas:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener historial de mermas' });
  }
}

// 16. Desactivar/Eliminar Producto (Solo Administradores)
export async function eliminarProducto(req: AuthenticatedRequest, res: Response) {
  const productoId = parseInt(req.params.productoId);

  if (isNaN(productoId)) {
    return res.status(400).json({ error: 'ID de producto inválido' });
  }

  try {
    // Soft-delete: set activo to false
    await prisma.producto.update({
      where: { id: productoId },
      data: { activo: false },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('inventario:actualizar');
    }

    return res.json({ message: 'Producto eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({ error: error.message || 'Error al eliminar el producto' });
  }
}

// 17. Fusionar Cuentas Abiertas
export async function fusionarCuentas(req: AuthenticatedRequest, res: Response) {
  const { cuenta_origen_id, cuenta_destino_id } = req.body;

  if (!cuenta_origen_id || !cuenta_destino_id) {
    return res.status(400).json({ error: 'Faltan IDs de las cuentas a fusionar' });
  }

  if (cuenta_origen_id === cuenta_destino_id) {
    return res.status(400).json({ error: 'No puedes fusionar una cuenta consigo misma' });
  }

  try {
    // 1. Validar que ambas existan y estén abiertas
    const cuentaOrigen = await prisma.cuenta.findUnique({
      where: { id: parseInt(cuenta_origen_id) },
      include: { detalleCuentas: true }
    });
    const cuentaDestino = await prisma.cuenta.findUnique({
      where: { id: parseInt(cuenta_destino_id) },
      include: { detalleCuentas: true }
    });

    if (!cuentaOrigen || cuentaOrigen.closed_at) {
      return res.status(400).json({ error: 'La cuenta origen no existe o ya está cerrada' });
    }
    if (!cuentaDestino || cuentaDestino.closed_at) {
      return res.status(400).json({ error: 'La cuenta destino no existe o ya está cerrada' });
    }

    // 2. Transaccionar la fusión
    await prisma.$transaction(async (tx) => {
      const areaOrigen = cuentaOrigen.area_id === 1 ? 'Bar' : cuentaOrigen.area_id === 2 ? 'Snack' : 'Palapa';
      const areaDestino = cuentaDestino.area_id === 1 ? 'Bar' : cuentaDestino.area_id === 2 ? 'Snack' : 'Palapa';

      // Etiquetar consumos de la cuenta destino con su área actual
      for (const det of cuentaDestino.detalleCuentas) {
        const tag = `(${areaDestino})`;
        if (!det.notas || !det.notas.includes(tag)) {
          const nuevaNota = det.notas ? `${det.notas} ${tag}` : tag;
          await tx.detalleCuenta.update({
            where: { id: det.id },
            data: { notas: nuevaNota }
          });
        }
      }

      // Mover los detalles de la cuenta origen a la destino actualizando sus notas con la procedencia
      for (const det of cuentaOrigen.detalleCuentas) {
        const areaNota = `(${areaOrigen})`;
        const notaLimpia = det.notas ? `${det.notas} ${areaNota}` : areaNota;
        await tx.detalleCuenta.update({
          where: { id: det.id },
          data: {
            cuenta_id: cuentaDestino.id,
            notas: notaLimpia
          }
        });
      }

      // Recalcular los totales de la cuenta destino
      // Todos los detalles de ambas cuentas (origen + destino) ahora pertenecen a destino en memoria
      const detallesCombinados = [...cuentaDestino.detalleCuentas, ...cuentaOrigen.detalleCuentas];
      const nuevoSubtotal = detallesCombinados.reduce((acc, curr) => acc + Number(curr.subtotal), 0);
      const nuevosImpuestos = detallesCombinados.reduce((acc, curr) => acc + Number(curr.impuestos), 0);
      const nuevoTotal = detallesCombinados.reduce((acc, curr) => acc + Number(curr.total), 0);

      await tx.cuenta.update({
        where: { id: cuentaDestino.id },
        data: {
          subtotal: nuevoSubtotal,
          impuestos: nuevosImpuestos,
          total: nuevoTotal
        }
      });

      // Marcar la cuenta origen como fusionada
      await tx.cuenta.update({
        where: { id: cuentaOrigen.id },
        data: {
          estado: 'FUSIONADA',
          subtotal: 0,
          descuento: 0,
          impuestos: 0,
          total: 0
        }
      });
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('cuenta:actualizar');
    }

    return res.json({ message: 'Cuentas fusionadas correctamente' });
  } catch (error: any) {
    console.error('Error al fusionar cuentas:', error);
    return res.status(500).json({ error: error.message || 'Error al fusionar cuentas' });
  }
}

// 21. Cambiar una cuenta de área (Bar, Snack, Palapa)
export async function cambiarAreaCuenta(req: AuthenticatedRequest, res: Response) {
  const cuentaId = parseInt(req.params.cuentaId);
  const { area_id } = req.body;

  if (!area_id) {
    return res.status(400).json({ error: 'El área destino es requerida' });
  }

  try {
    const nuevoAreaId = parseInt(area_id);

    // 1. Obtener la cuenta
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      include: { divisionesCuentas: true }
    });

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    if (cuenta.area_id === nuevoAreaId) {
      return res.status(400).json({ error: 'La cuenta ya pertenece al área seleccionada' });
    }

    // 2. Buscar si hay un turno activo en la nueva área
    const turnoDestino = await prisma.turno.findFirst({
      where: { activo: true, area_id: nuevoAreaId },
      orderBy: { abierto_at: 'desc' }
    });

    if (!turnoDestino) {
      return res.status(400).json({ error: 'No hay un turno activo abierto en la nueva área. Por favor, abre el turno primero.' });
    }

    // 3. Actualizar la cuenta y sus divisiones asociadas
    await prisma.$transaction(async (tx) => {
      // Actualizar área y turno en la cuenta
      await tx.cuenta.update({
        where: { id: cuentaId },
        data: {
          area_id: nuevoAreaId,
          turno_id: turnoDestino.id
        }
      });

      // Si tiene divisiones de cuenta y ya fueron cobradas en el turno anterior,
      // actualizamos su turno_pago_id al nuevo turno activo para reubicar los ingresos
      if (cuenta.divisionesCuentas.length > 0) {
        await tx.divisionCuenta.updateMany({
          where: {
            cuenta_id: cuentaId,
            OR: [
              { turno_pago_id: cuenta.turno_id },
              { turno_pago_id: null, estado_pago: 'PAGADO' }
            ]
          },
          data: {
            turno_pago_id: turnoDestino.id
          }
        });
      }
    });

    // 4. Notificar cambios por WebSockets
    const io = req.app.get('io');
    if (io) {
      io.emit('cuenta:actualizar');
    }

    return res.json({ message: 'Cuenta trasladada al área seleccionada exitosamente' });
  } catch (error: any) {
    console.error('Error al cambiar de área la cuenta:', error);
    return res.status(500).json({ error: error.message || 'Error al cambiar de área la cuenta' });
  }
}


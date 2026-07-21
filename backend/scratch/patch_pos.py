import os

file_path = r"c:\Users\ELITEBOOK\Desktop\campestreantigravity\backend\src\controllers\pos.controller.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Define the gestionarStock function
gestionar_stock_func = """
async function gestionarStock(tx: any, areaId: number, productoId: number, cantidadDiff: any, usuarioId: number, cuentaId: bigint) {
  if (cantidadDiff.isZero()) return;

  const prod = await tx.producto.findUnique({ where: { id: productoId } });
  if (!prod) throw new Error(`Producto con ID ${productoId} no encontrado`);

  const nombreProd = prod.nombre.trim().toLowerCase();

  if (cantidadDiff.greaterThan(0)) {
    // SALIDA DE INVENTARIO (Descontar stock)
    let cantidadPorDescontar = cantidadDiff;

    if (nombreProd === 'agua mineral prep') {
      const prodGrande = await tx.producto.findFirst({ where: { nombre: { equals: 'Agua Mineral Grande', mode: 'insensitive' } } });
      const prodNormal = await tx.producto.findFirst({ where: { nombre: { equals: 'Agua Mineral', mode: 'insensitive' } } });

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
      const prodNormal = await tx.producto.findFirst({ where: { nombre: { equals: 'Agua Mineral', mode: 'insensitive' } } });
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

"""

# Insert the helper function after the imports
content = content.replace("export async function listarProductosPorArea", gestionar_stock_func + "\nexport async function listarProductosPorArea")

# Modify guardarConsumos to calculate diffs and call gestionarStock
guardar_consumos_orig = """    // Usaremos una transacción para recrear los detalles e imputar subtotales
    const cuentaActualizada = await prisma.$transaction(async (tx) => {
      // Eliminar detalles previos de la cuenta
      await tx.detalleCuenta.deleteMany({ where: { cuenta_id: cuentaId } });"""

guardar_consumos_new = """    const usuarioId = req.user?.id || 1; // Fallback admin if needed

    // Usaremos una transacción para recrear los detalles e imputar subtotales
    const cuentaActualizada = await prisma.$transaction(async (tx) => {
      // 1. Obtener detalles previos para calcular diferencia de stock
      const detallesPrevios = await tx.detalleCuenta.findMany({ where: { cuenta_id: cuentaId } });
      const prevQtys: Record<number, any> = {};
      for (const dp of detallesPrevios) {
        if (!prevQtys[dp.producto_id]) prevQtys[dp.producto_id] = new Decimal(0);
        prevQtys[dp.producto_id] = prevQtys[dp.producto_id].plus(new Decimal(dp.cantidad));
      }

      const newQtys: Record<number, any> = {};
      for (const p of productos) {
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
      await tx.detalleCuenta.deleteMany({ where: { cuenta_id: cuentaId } });"""

content = content.replace(guardar_consumos_orig, guardar_consumos_new)

# Remove the stock deduction from pagarYCerrarCuenta
pagar_cerrar_orig_start = """      // 1. Validar y descontar stock por cada producto en la cuenta en esa área física
      for (const item of cuenta.detalleCuentas) {"""

# Let's find the exact string to remove using a regex or string indexing
start_idx = content.find(pagar_cerrar_orig_start)
end_str = """      if (esPagoDirecto) {
        // 2a. Pago Directo — cerrar la cuenta con el método de pago indicado (sin divisiones)"""
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + end_str + content[end_idx + len(end_str):]
else:
    print("Could not find pagarYCerrarCuenta block")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("done")

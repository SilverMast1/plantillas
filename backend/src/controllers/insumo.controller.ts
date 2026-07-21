import { Response } from 'express';
import { Decimal } from 'decimal.js';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 1. Listar todos los insumos con alerta de stock crítico
export async function listarInsumos(req: AuthenticatedRequest, res: Response) {
  try {
    const insumos = await prisma.insumo.findMany({
      orderBy: { nombre: 'asc' },
    });

    const resultado = insumos.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      stock: Number(i.stock),
      unidad: i.unidad,
      stock_minimo: Number(i.stock_minimo),
      critico: Number(i.stock) <= Number(i.stock_minimo),
    }));

    return res.json(resultado);
  } catch (error) {
    console.error('Error al listar insumos:', error);
    return res.status(500).json({ error: 'Error al consultar catálogo de insumos' });
  }
}

// 2. Crear insumo
export async function crearInsumo(req: AuthenticatedRequest, res: Response) {
  const { nombre, stock, unidad, stock_minimo } = req.body;

  if (!nombre || !unidad) {
    return res.status(400).json({ error: 'Nombre y unidad de medida son obligatorios' });
  }

  try {
    const nuevo = await prisma.insumo.create({
      data: {
        nombre,
        stock: new Decimal(stock || 0),
        unidad,
        stock_minimo: new Decimal(stock_minimo || 0),
      },
    });

    return res.status(201).json({
      message: 'Insumo creado correctamente',
      insumo: {
        id: nuevo.id,
        nombre: nuevo.nombre,
        stock: Number(nuevo.stock),
        unidad: nuevo.unidad,
        stock_minimo: Number(nuevo.stock_minimo),
      },
    });
  } catch (error: any) {
    console.error('Error al crear insumo:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un insumo con ese nombre' });
    }
    return res.status(500).json({ error: 'Error al dar de alta el insumo' });
  }
}

// 3. Actualizar insumo
export async function actualizarInsumo(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id);
  const { nombre, stock, unidad, stock_minimo } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID de insumo inválido' });
  }

  try {
    const dataUpdate: any = {};
    if (nombre !== undefined) dataUpdate.nombre = nombre;
    if (stock !== undefined) dataUpdate.stock = new Decimal(stock);
    if (unidad !== undefined) dataUpdate.unidad = unidad;
    if (stock_minimo !== undefined) dataUpdate.stock_minimo = new Decimal(stock_minimo);

    const actualizado = await prisma.insumo.update({
      where: { id },
      data: dataUpdate,
    });

    return res.json({
      message: 'Insumo actualizado correctamente',
      insumo: {
        id: actualizado.id,
        nombre: actualizado.nombre,
        stock: Number(actualizado.stock),
        unidad: actualizado.unidad,
        stock_minimo: Number(actualizado.stock_minimo),
      },
    });
  } catch (error) {
    console.error('Error al actualizar insumo:', error);
    return res.status(500).json({ error: 'Error al actualizar el insumo' });
  }
}

// 4. Eliminar insumo
export async function eliminarInsumo(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID de insumo inválido' });
  }

  try {
    await prisma.insumo.delete({
      where: { id },
    });
    return res.json({ message: 'Insumo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar insumo:', error);
    return res.status(500).json({ error: 'Error al eliminar el insumo' });
  }
}

// 5. Guardar/Actualizar receta de un producto
export async function guardarReceta(req: AuthenticatedRequest, res: Response) {
  const productoId = parseInt(req.params.productoId);
  const { ingredientes } = req.body; // ingredientes = [ { insumo_id: number, cantidad: number } ]

  if (isNaN(productoId)) {
    return res.status(400).json({ error: 'ID de producto inválido' });
  }

  if (!Array.isArray(ingredientes)) {
    return res.status(400).json({ error: 'Los ingredientes deben ser enviados como un arreglo' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Eliminar receta existente
      await tx.recetaIngrediente.deleteMany({
        where: { producto_id: productoId },
      });

      // Crear nuevos registros de receta
      for (const ing of ingredientes) {
        await tx.recetaIngrediente.create({
          data: {
            producto_id: productoId,
            insumo_id: parseInt(ing.insumo_id),
            cantidad: new Decimal(ing.cantidad),
          },
        });
      }
    });

    return res.json({ message: 'Receta guardada exitosamente' });
  } catch (error) {
    console.error('Error al guardar receta:', error);
    return res.status(500).json({ error: 'Error al guardar la receta del producto' });
  }
}

// 6. Obtener receta de un producto
export async function obtenerReceta(req: AuthenticatedRequest, res: Response) {
  const productoId = parseInt(req.params.productoId);

  if (isNaN(productoId)) {
    return res.status(400).json({ error: 'ID de producto inválido' });
  }

  try {
    const receta = await prisma.recetaIngrediente.findMany({
      where: { producto_id: productoId },
      include: {
        insumo: true,
      },
    });

    const resultado = receta.map((r) => ({
      insumo_id: r.insumo_id,
      nombre_insumo: r.insumo.nombre,
      unidad: r.insumo.unidad,
      cantidad: Number(r.cantidad),
    }));

    return res.json(resultado);
  } catch (error) {
    console.error('Error al obtener receta:', error);
    return res.status(500).json({ error: 'Error al obtener la receta' });
  }
}

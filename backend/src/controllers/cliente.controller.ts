import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from 'decimal.js';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 1. Obtener datos de perfil del socio autenticado
export async function obtenerPerfilSocio(req: AuthenticatedRequest, res: Response) {
  const socioId = req.user?.id;

  if (!socioId) {
    return res.status(401).json({ error: 'Socio no autenticado' });
  }

  try {
    const socio = await prisma.cliente.findUnique({
      where: { id: socioId },
      select: {
        id: true,
        codigo_socio: true,
        nombre: true,
        email: true,
        telefono: true,
        activo: true,
        qr_token: true,
      },
    });

    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    return res.json(socio);
  } catch (error) {
    console.error('Error al obtener perfil de socio:', error);
    return res.status(500).json({ error: 'Error al consultar datos' });
  }
}

// 2. Obtener historial de consumos y gastos del socio
export async function listarConsumosSocio(req: AuthenticatedRequest, res: Response) {
  const socioId = req.user?.id;

  if (!socioId) {
    return res.status(401).json({ error: 'Socio no autenticado' });
  }

  try {
    // Buscar todas las divisiones de cuenta donde el cliente haya pagado
    const divisiones = await prisma.divisionCuenta.findMany({
      where: { cliente_id: socioId },
      include: {
        cuenta: {
          include: {
            area: true,
            usuario: { select: { nombre: true } },
            cadi: true,
            detalleCuentas: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
      orderBy: { pagado_at: 'desc' },
    });

    // Formatear el historial de consumos del socio
    const historial = divisiones.map((div) => {
      const cuenta = div.cuenta;
      return {
        division_id: div.id,
        cuenta_id: cuenta.id,
        area: cuenta.area.nombre,
        atendido_por: cuenta.usuario.nombre,
        cadi: cuenta.cadi ? cuenta.cadi.nombre : null,
        fecha_pago: div.pagado_at,
        fecha_consumo: cuenta.closed_at || cuenta.created_at,
        estado_pago: div.estado_pago,
        metodo_pago: div.metodo_pago,
        total_cuenta_grupo: Number(cuenta.total),
        mi_porcentaje: Number(div.porcentaje_participacion),
        mi_pago: Number(div.monto_proporcional),
        consumo_detalle: cuenta.detalleCuentas.map((dc) => ({
          producto: dc.producto.nombre,
          cantidad: Number(dc.cantidad),
          precio_unitario: Number(dc.precio_unitario),
          subtotal: Number(dc.subtotal),
        })),
      };
    });

    return res.json(historial);
  } catch (error) {
    console.error('Error al obtener consumos de socio:', error);
    return res.status(500).json({ error: 'Error al consultar historial de consumos' });
  }
}

// 3. Regenerar el código QR dinámico de membresía
export async function regenerarTokenQR(req: AuthenticatedRequest, res: Response) {
  const socioId = req.user?.id;

  if (!socioId) {
    return res.status(401).json({ error: 'Socio no autenticado' });
  }

  try {
    const nuevoToken = uuidv4();

    const socioActualizado = await prisma.cliente.update({
      where: { id: socioId },
      data: { qr_token: nuevoToken },
      select: { qr_token: true },
    });

    return res.json({ qr_token: socioActualizado.qr_token });
  } catch (error) {
    console.error('Error al regenerar token QR:', error);
    return res.status(500).json({ error: 'Error al generar código QR' });
  }
}

// 4. Buscar socio por token de QR (POS Vendedor)
export async function buscarSocioPorQR(req: AuthenticatedRequest, res: Response) {
  const { qr_token } = req.body;

  if (!qr_token) {
    return res.status(400).json({ error: 'Token de QR requerido' });
  }

  try {
    const socio = await prisma.cliente.findUnique({
      where: { qr_token },
      select: {
        id: true,
        codigo_socio: true,
        nombre: true,
        email: true,
        activo: true,
      },
    });

    if (!socio || !socio.activo) {
      return res.status(404).json({ error: 'Socio no encontrado o cuenta de membresía inactiva' });
    }

    return res.json(socio);
  } catch (error) {
    console.error('Error al buscar socio por QR:', error);
    return res.status(500).json({ error: 'Error al procesar búsqueda por QR' });
  }
}

// 5. Autocompletado de socios (Búsqueda rápida por nombre o código de socio)
export async function buscarSocios(req: AuthenticatedRequest, res: Response) {
  const query = req.query.q as string;

  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    const socios = await prisma.cliente.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query } },
          { codigo_socio: { contains: query } },
        ],
      },
      select: {
        id: true,
        codigo_socio: true,
        nombre: true,
        email: true,
      },
      take: 10,
    });

    return res.json(socios);
  } catch (error) {
    console.error('Error al buscar socios:', error);
    return res.status(500).json({ error: 'Error al procesar búsqueda' });
  }
}

// 6. Eliminar socio (Admin y Vendedor)
export async function eliminarSocio(req: AuthenticatedRequest, res: Response) {
  const socioId = parseInt(req.params.socioId);

  if (isNaN(socioId)) {
    return res.status(400).json({ error: 'ID de socio inválido' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.asignacionCadiCliente.deleteMany({ where: { cliente_id: socioId } });
      await tx.divisionCuenta.deleteMany({ where: { cliente_id: socioId } });
      await tx.cuenta.updateMany({ where: { cliente_id: socioId }, data: { cliente_id: null } });
      await tx.cliente.delete({ where: { id: socioId } });
    });
    return res.json({ message: 'Socio eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar socio:', error);
    return res.status(500).json({ error: error.message || 'Error al eliminar el socio' });
  }
}

// 6.5 Actualizar socio
export async function actualizarSocio(req: AuthenticatedRequest, res: Response) {
  const socioId = parseInt(req.params.socioId);
  const { nombre, email, telefono, codigo_socio } = req.body;

  if (isNaN(socioId)) {
    return res.status(400).json({ error: 'ID de socio inválido' });
  }

  try {
    const socioActualizado = await prisma.cliente.update({
      where: { id: socioId },
      data: {
        nombre: nombre ? nombre.trim().toUpperCase() : undefined,
        email,
        telefono,
        codigo_socio
      }
    });
    return res.json(socioActualizado);
  } catch (error: any) {
    console.error('Error al actualizar socio:', error);
    return res.status(500).json({ error: error.message || 'Error al actualizar el socio' });
  }
}

// 7. Listar todos los socios (Admin y Vendedor)
export async function listarSocios(req: AuthenticatedRequest, res: Response) {
  try {
    const socios = await prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, codigo_socio: true, nombre: true, email: true, telefono: true, created_at: true },
      orderBy: { nombre: 'asc' },
    });
    return res.json(socios);
  } catch (error) {
    console.error('Error al listar socios:', error);
    return res.status(500).json({ error: 'Error al consultar socios' });
  }
}

// 8. Listar socios con cargos pendientes (deudas)
export async function listarCargosSocios(req: AuthenticatedRequest, res: Response) {
  try {
    const sociosConCargos = await prisma.cliente.findMany({
      where: {
        activo: true,
        divisionesCuentas: {
          some: {
            metodo_pago: 'CARGO_SOCIO',
          },
        },
      },
      include: {
        divisionesCuentas: {
          where: {
            metodo_pago: 'CARGO_SOCIO',
          },
        },
      },
    });

    const resultado = sociosConCargos.map((socio) => {
      const saldoPendiente = socio.divisionesCuentas
        .filter(div => div.estado_pago === 'PENDIENTE')
        .reduce((sum, div) => sum.plus(new Decimal(div.monto_proporcional)), new Decimal(0));
      return {
        id: socio.id,
        codigo_socio: socio.codigo_socio,
        nombre: socio.nombre,
        email: socio.email,
        telefono: socio.telefono,
        saldo_pendiente: saldoPendiente.toNumber(),
      };
    });

    return res.json(resultado);
  } catch (error) {
    console.error('Error al listar cargos de socios:', error);
    return res.status(500).json({ error: 'Error al consultar cargos de socios' });
  }
}

// 9. Obtener detalle de deudas/cargos de un socio
export async function obtenerDetalleCargosSocio(req: AuthenticatedRequest, res: Response) {
  const socioId = parseInt(req.params.socioId);

  if (isNaN(socioId)) {
    return res.status(400).json({ error: 'ID de socio inválido' });
  }

  try {
    const divisiones = await prisma.divisionCuenta.findMany({
      where: {
        cliente_id: socioId,
        metodo_pago: 'CARGO_SOCIO',
      },
      include: {
        cuenta: {
          include: {
            area: true,
            usuario: { select: { nombre: true } },
            cadi: true,
            detalleCuentas: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
      orderBy: { pagado_at: 'desc' },
    });

    const detalle = divisiones.map((div) => {
      const cuenta = div.cuenta;
      return {
        division_id: div.id.toString(),
        cuenta_id: cuenta.id.toString(),
        area: cuenta.area.nombre,
        atendido_por: cuenta.usuario.nombre,
        fecha: div.pagado_at || cuenta.closed_at || cuenta.created_at,
        monto: Number(div.monto_proporcional),
        porcentaje_participacion: Number(div.porcentaje_participacion),
        total_cuenta: Number(cuenta.total),
        cadi: cuenta.cadi ? `${cuenta.cadi.numero_cadi} - ${cuenta.cadi.nombre}` : null,
        productos: cuenta.detalleCuentas.map((dc) => ({
          nombre: dc.producto.nombre,
          cantidad: Number(dc.cantidad),
          precio: Number(dc.precio_unitario),
          subtotal: Number(dc.subtotal),
        })),
      };
    });

    return res.json(detalle);
  } catch (error) {
    console.error('Error al obtener detalle de cargos de socio:', error);
    return res.status(500).json({ error: 'Error al consultar detalle de cargos' });
  }
}

// 10. Liquidar cargos de un socio (registrar pago real)
export async function liquidarCargosSocio(req: AuthenticatedRequest, res: Response) {
  const socioId = parseInt(req.params.socioId);
  const { metodo_pago, divisionesIds, area_id } = req.body;

  if (isNaN(socioId)) {
    return res.status(400).json({ error: 'ID de socio inválido' });
  }

  if (!metodo_pago || (metodo_pago !== 'EFECTIVO' && metodo_pago !== 'TARJETA' && metodo_pago !== 'TRANSFERENCIA')) {
    return res.status(400).json({ error: 'Método de pago inválido (debe ser EFECTIVO, TARJETA o TRANSFERENCIA)' });
  }

  try {
    const whereClause: any = {
      cliente_id: socioId,
      metodo_pago: 'CARGO_SOCIO',
    };

    if (Array.isArray(divisionesIds) && divisionesIds.length > 0) {
      const parsedIds = divisionesIds.map((id) => parseInt(id));
      whereClause.id = { in: parsedIds };
    }

    let turnoActivoId: number | null = null;
    const activeShift = await prisma.turno.findFirst({
      where: { activo: true, ...(area_id ? { area_id: Number(area_id) } : {}) },
    });
    if (activeShift) {
      turnoActivoId = activeShift.id;
    }

    const divisiones = await prisma.divisionCuenta.findMany({
      where: whereClause,
    });

    await prisma.$transaction(async (tx) => {
      for (const div of divisiones) {
        await tx.divisionCuenta.update({
          where: { id: div.id },
          data: {
            metodo_pago: metodo_pago,
            estado_pago: 'PAGADO',
            pagado_at: new Date(),
            monto_efectivo: metodo_pago === 'EFECTIVO' ? div.monto_proporcional : 0.0,
            monto_tarjeta: metodo_pago === 'TARJETA' ? div.monto_proporcional : 0.0,
            turno_pago_id: turnoActivoId,
          },
        });
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('cuenta:actualizar');
    }

    return res.json({
      message: 'Cargos liquidados correctamente',
      cargos_actualizados: divisiones.length,
    });
  } catch (error) {
    console.error('Error al liquidar cargos de socio:', error);
    return res.status(500).json({ error: 'Error al registrar la liquidación de cargos' });
  }
}

// 11. Borrar cargos/adeudos de un socio (cancelar sin pago real, manteniendo inventario y compra guardada)
export async function borrarCargosSocio(req: AuthenticatedRequest, res: Response) {
  const socioId = parseInt(req.params.socioId);
  const { divisionesIds } = req.body;

  if (isNaN(socioId)) {
    return res.status(400).json({ error: 'ID de socio inválido' });
  }

  try {
    const whereClause: any = {
      cliente_id: socioId,
      metodo_pago: 'CARGO_SOCIO',
    };

    if (Array.isArray(divisionesIds) && divisionesIds.length > 0) {
      const parsedIds = divisionesIds.map((id) => parseInt(id));
      whereClause.id = { in: parsedIds };
    }

    const result = await prisma.divisionCuenta.updateMany({
      where: whereClause,
      data: {
        metodo_pago: 'BORRADO',
        estado_pago: 'BORRADO',
        pagado_at: new Date(),
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('cuenta:actualizar');
    }

    return res.json({
      message: 'Adeudos borrados correctamente. La compra permanece registrada y el stock no se altera.',
      cargos_actualizados: result.count,
    });
  } catch (error) {
    console.error('Error al borrar cargos de socio:', error);
    return res.status(500).json({ error: 'Error al borrar los cargos/adeudos del socio' });
  }
}

// 12. Obtener cuenta abierta (activa en tiempo real) del socio autenticado (con/sin cadi)
export async function obtenerCuentaActivaSocio(req: AuthenticatedRequest, res: Response) {
  const socioId = req.user?.id;

  if (!socioId) {
    return res.status(401).json({ error: 'Socio no autenticado' });
  }

  try {
    const socio = await prisma.cliente.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    // 1. Intentar buscar por asignación de Cadi activa
    const asignacionCadi = await prisma.asignacionCadiCliente.findFirst({
      where: { cliente_id: socioId, activa: true },
      select: { cadi_id: true },
    });

    let cuenta: any = null;
    let totalIntegrantes = 1;

    if (asignacionCadi) {
      const totalClientesCadi = await prisma.asignacionCadiCliente.count({
        where: { cadi_id: asignacionCadi.cadi_id, activa: true },
      });
      totalIntegrantes = totalClientesCadi || 1;

      cuenta = await prisma.cuenta.findFirst({
        where: {
          cadi_id: asignacionCadi.cadi_id,
          estado: 'ABIERTA',
        },
        include: {
          area: true,
          usuario: { select: { nombre: true } },
          detalleCuentas: {
            include: { producto: true },
          },
        },
      });
    }

    // 2. Si no hay cuenta por Cadi, intentar buscar por nombre en nombre_referencia
    if (!cuenta) {
      cuenta = await prisma.cuenta.findFirst({
        where: {
          estado: 'ABIERTA',
          nombre_referencia: {
            contains: socio.nombre,
          },
        },
        include: {
          area: true,
          usuario: { select: { nombre: true } },
          detalleCuentas: {
            include: { producto: true },
          },
        },
      });

      if (cuenta && cuenta.nombre_referencia) {
        // Estimar integrantes separando por comas
        const nombres = cuenta.nombre_referencia.split(',');
        totalIntegrantes = nombres.length || 1;
      }
    }

    if (!cuenta) {
      return res.json({ activa: false });
    }

    // Formatear respuesta
    const productos = cuenta.detalleCuentas.map((dc: any) => ({
      nombre: dc.producto.nombre,
      cantidad: Number(dc.cantidad),
      precio: Number(dc.precio_unitario),
      subtotal: Number(dc.subtotal),
    }));

    const totalAcumulado = Number(cuenta.total);
    const subtotalAcumulado = Number(cuenta.subtotal);
    const descuentoAcumulado = Number(cuenta.descuento);

    return res.json({
      activa: true,
      cuenta_id: cuenta.id.toString(),
      area: cuenta.area.nombre,
      atendido_por: cuenta.usuario.nombre,
      referencia: cuenta.nombre_referencia,
      productos,
      subtotal: subtotalAcumulado,
      descuento: descuentoAcumulado,
      total: totalAcumulado,
      total_integrantes: totalIntegrantes,
      mi_total_estimado: Number((totalAcumulado / totalIntegrantes).toFixed(2)),
    });
  } catch (error) {
    console.error('Error al obtener cuenta activa de socio:', error);
    return res.status(500).json({ error: 'Error al consultar cuenta activa' });
  }
}

// 13. Obtener el siguiente código secuencial para Socio o Empleado
export async function obtenerSiguienteCodigoSocio(req: AuthenticatedRequest, res: Response) {
  const tipo = (req.query.tipo as string || 'SOCIO').toUpperCase();
  const prefijo = tipo === 'EMPLEADO' ? 'EMPLEADO-' : 'SOCIO-';
  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        codigo_socio: {
          startsWith: prefijo,
        },
      },
      select: {
        codigo_socio: true,
      },
    });

    let maxNum = 0;
    for (const c of clientes) {
      const code = c.codigo_socio || '';
      const numPart = code.substring(prefijo.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    return res.json({ siguiente_codigo: `${prefijo}${maxNum + 1}` });
  } catch (error) {
    console.error('Error al calcular siguiente código:', error);
    return res.status(500).json({ error: 'Error al calcular siguiente código' });
  }
}




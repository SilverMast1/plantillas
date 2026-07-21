import prisma from './db';
import { Decimal } from 'decimal.js';

async function main() {
  console.log('Iniciando simulación de ventas y cortes de caja (Mock Seeder)...');

  // 1. Limpieza de tablas transaccionales, de turnos y relaciones
  console.log('Limpiando tablas...');
  await prisma.divisionCuenta.deleteMany({});
  await prisma.detalleCuenta.deleteMany({});
  await prisma.cuenta.deleteMany({});
  await prisma.movimientoInventario.deleteMany({});
  await prisma.retiroCaja.deleteMany({});
  await prisma.turno.deleteMany({});
  await prisma.asignacionCadiCliente.deleteMany({});
  await prisma.cadi.deleteMany({});
  await prisma.cliente.deleteMany({});
  console.log('Tablas limpiadas.');

  // 2. Crear socios de prueba
  console.log('Creando socios...');
  const socio1 = await prisma.cliente.create({
    data: {
      codigo_socio: 'SOCIO-001',
      nombre: 'Alejandro González',
      email: 'alejandro@campestre.com',
      password_hash: 'socio123',
      activo: true,
      qr_token: 'qr-token-alejandro-101'
    }
  });

  const socio2 = await prisma.cliente.create({
    data: {
      codigo_socio: 'SOCIO-002',
      nombre: 'Sofía Martínez',
      email: 'sofia@campestre.com',
      password_hash: 'socio123',
      activo: true,
      qr_token: 'qr-token-sofia-102'
    }
  });

  const socio3 = await prisma.cliente.create({
    data: {
      codigo_socio: 'SOCIO-003',
      nombre: 'Diego Torres',
      email: 'diego@campestre.com',
      password_hash: 'socio123',
      activo: true,
      qr_token: 'qr-token-diego-103'
    }
  });

  // 3. Crear cadis de prueba
  console.log('Creando cadis...');
  const cadi1 = await prisma.cadi.create({
    data: {
      numero_cadi: 'CADI-001',
      nombre: 'Juan Pérez',
      estado: 'DISPONIBLE'
    }
  });

  const cadi2 = await prisma.cadi.create({
    data: {
      numero_cadi: 'CADI-002',
      nombre: 'Carlos Gómez',
      estado: 'DISPONIBLE'
    }
  });

  // Obtener usuario interno (vendedor o admin)
  const usuario = await prisma.usuario.findFirst({
    where: { username: 'admin' }
  });

  if (!usuario) {
    throw new Error('Debe existir el usuario "admin" en la base de datos (corre primero npm run db:seed)');
  }

  // Obtener productos disponibles en la BD
  const productos = await prisma.producto.findMany({});
  if (productos.length === 0) {
    throw new Error('No hay productos en la base de datos para simular ventas');
  }

  const findProd = (name: string) => {
    const p = productos.find(x => x.nombre.toLowerCase().includes(name.toLowerCase()));
    return p || productos[0];
  };

  // Helper para insertar Cuenta, Detalle y Divisiones
  const crearCuentaSimulada = async (params: {
    area_id: number;
    turno_id: number;
    nombre_referencia: string;
    closed_at: Date;
    items: { name: string; cantidad: number }[];
    pagos: { cliente_id?: number; metodo: 'EFECTIVO' | 'TARJETA' | 'CARGO_SOCIO'; monto: number; nombre: string }[];
  }) => {
    let subtotal = new Decimal(0);
    const lineas = [];

    for (const item of params.items) {
      const prod = findProd(item.name);
      const precio = new Decimal(prod.precio_venta);
      const itemSubtotal = precio.mul(item.cantidad);
      subtotal = subtotal.plus(itemSubtotal);

      lineas.push({
        producto_id: prod.id,
        cantidad: new Decimal(item.cantidad),
        precio_unitario: precio,
        subtotal: itemSubtotal,
        total: itemSubtotal,
        estado_item: 'ENTREGADO'
      });
    }

    const total = subtotal;

    // Crear cuenta madre
    const cuenta = await prisma.cuenta.create({
      data: {
        area_id: params.area_id,
        usuario_id: usuario.id,
        turno_id: params.turno_id,
        nombre_referencia: params.nombre_referencia,
        estado: 'PAGADA',
        subtotal,
        total,
        created_at: params.closed_at,
        closed_at: params.closed_at,
        metodo_pago: params.pagos.length === 1 && !params.pagos[0].cliente_id ? params.pagos[0].metodo : null
      }
    });

    // Crear detalle_cuentas
    for (const lin of lineas) {
      await prisma.detalleCuenta.create({
        data: {
          cuenta_id: cuenta.id,
          producto_id: lin.producto_id,
          cantidad: lin.cantidad,
          precio_unitario: lin.precio_unitario,
          subtotal: lin.subtotal,
          total: lin.total,
          estado_item: lin.estado_item,
          created_at: params.closed_at
        }
      });
    }

    // Crear divisiones_cuentas si es split o directo socio
    for (const pago of params.pagos) {
      if (pago.cliente_id) {
        await prisma.divisionCuenta.create({
          data: {
            cuenta_id: cuenta.id,
            cliente_id: pago.cliente_id,
            porcentaje_participacion: new Decimal(pago.monto).div(total).mul(100),
            monto_proporcional: new Decimal(pago.monto),
            metodo_pago: pago.metodo,
            estado_pago: pago.metodo === 'CARGO_SOCIO' ? 'PENDIENTE' : 'PAGADO',
            pagado_at: pago.metodo === 'CARGO_SOCIO' ? null : params.closed_at
          }
        });
      }
    }

    return { total, pagos: params.pagos };
  };

  // Helper para crear Turno cerrado
  const crearTurnoSimulado = async (params: {
    abierto_at: Date;
    cerrado_at: Date;
    fondo_inicial: number;
    activo: boolean;
  }) => {
    return await prisma.turno.create({
      data: {
        usuario_id: usuario.id,
        fondo_inicial: new Decimal(params.fondo_inicial),
        caja_efectivo: new Decimal(0),
        caja_tarjeta: new Decimal(0),
        caja_cargos: new Decimal(0),
        abierto_at: params.abierto_at,
        cerrado_at: params.activo ? null : params.cerrado_at,
        activo: params.activo
      }
    });
  };

  const actualizarTurnoTotales = async (turnoId: number, fondo: number, cuentasList: { total: Decimal; pagos: any[] }[]) => {
    let efectivo = new Decimal(0);
    let tarjeta = new Decimal(0);
    let cargos = new Decimal(0);

    for (const cta of cuentasList) {
      for (const pago of cta.pagos) {
        const monto = new Decimal(pago.monto);
        if (pago.metodo === 'EFECTIVO') efectivo = efectivo.plus(monto);
        else if (pago.metodo === 'TARJETA') tarjeta = tarjeta.plus(monto);
        else if (pago.metodo === 'CARGO_SOCIO') cargos = cargos.plus(monto);
      }
    }

    await prisma.turno.update({
      where: { id: turnoId },
      data: {
        caja_efectivo: efectivo.plus(fondo), // Caja Efectivo total = fondo + efectivo vendido
        caja_tarjeta: tarjeta,
        caja_cargos: cargos
      }
    });
  };

  // ==========================================
  // SIMULACIÓN DE DATOS TEMPORALES (JUNIO 2026)
  // ==========================================

  // --- DÍA 19/06/2026 (HOY) ---
  console.log('Simulando datos de hoy (19/06)...');
  // Turno 1 (Cerrado de la mañana)
  const t1 = await crearTurnoSimulado({
    abierto_at: new Date('2026-06-19T10:00:00'),
    cerrado_at: new Date('2026-06-19T15:00:00'),
    fondo_inicial: 500,
    activo: false
  });
  const c1 = await crearCuentaSimulada({
    area_id: 1, // Bar
    turno_id: t1.id,
    nombre_referencia: 'Mesa 4',
    closed_at: new Date('2026-06-19T12:30:00'),
    items: [
      { name: 'Corona Extra', cantidad: 4 },
      { name: 'Pechuga de pollo', cantidad: 2 }
    ], // 4x45 + 2x125 = 180 + 250 = 430
    pagos: [{ metodo: 'EFECTIVO', monto: 430, nombre: 'Pago directo' }]
  });
  const c2 = await crearCuentaSimulada({
    area_id: 3, // Palapa
    turno_id: t1.id,
    nombre_referencia: 'Mesa 8',
    closed_at: new Date('2026-06-19T14:15:00'),
    items: [
      { name: 'Agua Natural', cantidad: 3 },
      { name: 'Chilaquiles', cantidad: 2 }
    ], // 3x20 + 2x95 = 60 + 190 = 250
    pagos: [{ metodo: 'TARJETA', monto: 250, nombre: 'Pago directo' }]
  });
  await actualizarTurnoTotales(t1.id, 500, [c1, c2]);

  // Turno 2 (Cerrado de la tarde)
  const t2 = await crearTurnoSimulado({
    abierto_at: new Date('2026-06-19T15:30:00'),
    cerrado_at: new Date('2026-06-19T21:30:00'),
    fondo_inicial: 500,
    activo: false
  });
  const c3 = await crearCuentaSimulada({
    area_id: 2, // Snack
    turno_id: t2.id,
    nombre_referencia: 'Alejandro y Sofía',
    closed_at: new Date('2026-06-19T18:00:00'),
    items: [
      { name: 'Chicharrón de Ribeye', cantidad: 2 },
      { name: 'Refresco', cantidad: 2 }
    ], // 2x220 + 2x30 = 440 + 60 = 500
    pagos: [
      { cliente_id: socio1.id, metodo: 'CARGO_SOCIO', monto: 250, nombre: 'Alejandro González' },
      { cliente_id: socio2.id, metodo: 'CARGO_SOCIO', monto: 250, nombre: 'Sofía Martínez' }
    ]
  });
  await actualizarTurnoTotales(t2.id, 500, [c3]);

  // Turno 3 (Activo de la noche - listo para operar)
  await crearTurnoSimulado({
    abierto_at: new Date('2026-06-19T22:00:00'),
    cerrado_at: new Date(),
    fondo_inicial: 1000,
    activo: true
  });

  // --- DÍA 18/06/2026 (AYER) ---
  console.log('Simulando datos de ayer (18/06)...');
  const t4 = await crearTurnoSimulado({
    abierto_at: new Date('2026-06-18T09:00:00'),
    cerrado_at: new Date('2026-06-18T18:00:00'),
    fondo_inicial: 500,
    activo: false
  });
  const c4 = await crearCuentaSimulada({
    area_id: 1,
    turno_id: t4.id,
    nombre_referencia: 'Mesa 1',
    closed_at: new Date('2026-06-18T13:00:00'),
    items: [
      { name: 'Don Julio 70 Botella', cantidad: 1 }
    ], // 1x1700 = 1700
    pagos: [{ metodo: 'TARJETA', monto: 1700, nombre: 'Pago directo' }]
  });
  const c5 = await crearCuentaSimulada({
    area_id: 3,
    turno_id: t4.id,
    nombre_referencia: 'Mesa 2',
    closed_at: new Date('2026-06-18T15:30:00'),
    items: [
      { name: 'Arroz frito', cantidad: 2 },
      { name: 'Coca Vidrio', cantidad: 4 }
    ], // 2x75 + 4x30 = 150 + 120 = 270
    pagos: [{ metodo: 'EFECTIVO', monto: 270, nombre: 'Pago directo' }]
  });
  await actualizarTurnoTotales(t4.id, 500, [c4, c5]);

  // --- DÍA 17/06/2026 (MIÉRCOLES) ---
  console.log('Simulando datos del miércoles (17/06)...');
  const t5 = await crearTurnoSimulado({
    abierto_at: new Date('2026-06-17T09:00:00'),
    cerrado_at: new Date('2026-06-17T17:00:00'),
    fondo_inicial: 500,
    activo: false
  });
  const c6 = await crearCuentaSimulada({
    area_id: 2,
    turno_id: t5.id,
    nombre_referencia: 'Mesa 5',
    closed_at: new Date('2026-06-17T12:00:00'),
    items: [
      { name: 'Enchiladas Suizas', cantidad: 3 },
      { name: 'Jugo de naranja', cantidad: 3 }
    ], // 3x110 + 3x45 = 330 + 135 = 465
    pagos: [{ metodo: 'EFECTIVO', monto: 465, nombre: 'Pago directo' }]
  });
  const c7 = await crearCuentaSimulada({
    area_id: 1,
    turno_id: t5.id,
    nombre_referencia: 'Mesa 9',
    closed_at: new Date('2026-06-17T16:00:00'),
    items: [
      { name: 'Vodka Prep', cantidad: 6 }
    ], // 6x90 = 540
    pagos: [{ metodo: 'TARJETA', monto: 540, nombre: 'Pago directo' }]
  });
  await actualizarTurnoTotales(t5.id, 500, [c6, c7]);

  // --- DÍA 15/06/2026 (LUNES - INICIO DE ESTA SEMANA) ---
  console.log('Simulando datos del lunes (15/06)...');
  const t6 = await crearTurnoSimulado({
    abierto_at: new Date('2026-06-15T08:00:00'),
    cerrado_at: new Date('2026-06-15T19:00:00'),
    fondo_inicial: 500,
    activo: false
  });
  const c8 = await crearCuentaSimulada({
    area_id: 1,
    turno_id: t6.id,
    nombre_referencia: 'Diego Torres',
    closed_at: new Date('2026-06-15T14:00:00'),
    items: [
      { name: 'Don Julio Reposado Botella', cantidad: 1 },
      { name: 'Agua Mineral', cantidad: 5 }
    ], // 1x1400 + 5x30 = 1400 + 150 = 1550
    pagos: [
      { cliente_id: socio3.id, metodo: 'CARGO_SOCIO', monto: 1550, nombre: 'Diego Torres' }
    ]
  });
  const c9 = await crearCuentaSimulada({
    area_id: 3,
    turno_id: t6.id,
    nombre_referencia: 'Mesa 10',
    closed_at: new Date('2026-06-15T18:30:00'),
    items: [
      { name: 'Tenders con papas', cantidad: 2 },
      { name: 'Agua de sabor', cantidad: 2 }
    ], // 2x95 + 2x35 = 190 + 70 = 260
    pagos: [{ metodo: 'EFECTIVO', monto: 260, nombre: 'Pago directo' }]
  });
  await actualizarTurnoTotales(t6.id, 500, [c8, c9]);

  // --- DÍA 10/06/2026 (SEMANA ANTERIOR) ---
  console.log('Simulando datos de la semana pasada (10/06)...');
  const t7 = await crearTurnoSimulado({
    abierto_at: new Date('2026-06-10T10:00:00'),
    cerrado_at: new Date('2026-06-10T22:00:00'),
    fondo_inicial: 500,
    activo: false
  });
  const c10 = await crearCuentaSimulada({
    area_id: 2,
    turno_id: t7.id,
    nombre_referencia: 'Mesa 1',
    closed_at: new Date('2026-06-10T13:00:00'),
    items: [
      { name: 'Panini de pollo al chipotle', cantidad: 3 },
      { name: 'Fuze tea', cantidad: 3 }
    ], // 3x95 + 3x35 = 285 + 105 = 390
    pagos: [{ metodo: 'TARJETA', monto: 390, nombre: 'Pago directo' }]
  });
  const c11 = await crearCuentaSimulada({
    area_id: 1,
    turno_id: t7.id,
    nombre_referencia: 'Mesa 3',
    closed_at: new Date('2026-06-10T17:00:00'),
    items: [
      { name: 'XX Lager', cantidad: 10 },
      { name: 'Tacos de fideo', cantidad: 3 }
    ], // 10x45 + 3x95 = 450 + 285 = 735
    pagos: [{ metodo: 'EFECTIVO', monto: 735, nombre: 'Pago directo' }]
  });
  const c12 = await crearCuentaSimulada({
    area_id: 3,
    turno_id: t7.id,
    nombre_referencia: 'Alejandro González',
    closed_at: new Date('2026-06-10T20:30:00'),
    items: [
      { name: 'Maestro Dobel Botella', cantidad: 1 }
    ], // 1x1600 = 1600
    pagos: [
      { cliente_id: socio1.id, metodo: 'CARGO_SOCIO', monto: 1600, nombre: 'Alejandro González' }
    ]
  });
  await actualizarTurnoTotales(t7.id, 500, [c10, c11, c12]);

  // --- DÍA 03/06/2026 (HACE 2 SEMANAS - PERO EN EL MISMO MES) ---
  console.log('Simulando datos de hace 2 semanas (03/06)...');
  const t8 = await crearTurnoSimulado({
    abierto_at: new Date('2026-06-03T09:00:00'),
    cerrado_at: new Date('2026-06-03T18:00:00'),
    fondo_inicial: 500,
    activo: false
  });
  const c13 = await crearCuentaSimulada({
    area_id: 3,
    turno_id: t8.id,
    nombre_referencia: 'Mesa 12',
    closed_at: new Date('2026-06-03T12:30:00'),
    items: [
      { name: 'Menudo', cantidad: 2 },
      { name: 'Quesadillas', cantidad: 2 }
    ], // 2x110 + 2x70 = 220 + 140 = 360
    pagos: [{ metodo: 'EFECTIVO', monto: 360, nombre: 'Pago directo' }]
  });
  const c14 = await crearCuentaSimulada({
    area_id: 1,
    turno_id: t8.id,
    nombre_referencia: 'Mesa 14',
    closed_at: new Date('2026-06-03T15:00:00'),
    items: [
      { name: 'Don Pedro Prep', cantidad: 8 }
    ], // 8x90 = 720
    pagos: [{ metodo: 'TARJETA', monto: 720, nombre: 'Pago directo' }]
  });
  await actualizarTurnoTotales(t8.id, 500, [c13, c14]);

  console.log('Simulación de ventas y cortes de caja finalizada con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante la simulación de ventas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

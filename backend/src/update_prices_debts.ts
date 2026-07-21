import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

const PRECIOS = [
  { nombre: 'Omelettes (jamon, chorizo o champiñones)', precio: 79.00, categoria: 'desayunos' },
  { nombre: 'Huevos divorciados', precio: 85.00, categoria: 'desayunos' },
  { nombre: 'Huevos con jamon', precio: 69.00, categoria: 'desayunos' },
  { nombre: 'Huevos con chorizo', precio: 69.00, categoria: 'desayunos' },
  { nombre: 'Chilaquiles', precio: 110.00, categoria: 'desayunos' },
  { nombre: 'Quesadillas Harina o maiz', precio: 24.00, categoria: 'desayunos' },
  { nombre: 'Taco de picadillo', precio: 24.00, categoria: 'tacos de guisos' },
  { nombre: 'Taco de chicharron', precio: 28.00, categoria: 'tacos de guisos' },
  { nombre: 'Taco de huevo con jamon', precio: 24.00, categoria: 'tacos de guisos' },
  { nombre: 'Taco de papa con chorizo', precio: 24.00, categoria: 'tacos de guisos' },
  { nombre: 'Taco de choriqueso', precio: 28.00, categoria: 'tacos de guisos' },
  { nombre: 'Taco de barbacoa', precio: 28.00, categoria: 'tacos de guisos' },
  { nombre: 'Molletes', precio: 69.00, categoria: 'desayunos' },
  { nombre: 'Molletes chorizo, chicharron o picadillo', precio: 89.00, categoria: 'desayunos' },
  { nombre: 'Fruta con yogurt', precio: 75.00, categoria: 'desayunos' },
  { nombre: 'Pechuga de pollo', precio: 110.00, categoria: 'comida' },
  { nombre: 'Arroz con verduras', precio: 49.00, categoria: 'comida' },
  { nombre: 'Chicharrón de ribeye', precio: 290.00, categoria: 'comida' },
  { nombre: 'Tacos de fideo con chicharrón', precio: 149.00, categoria: 'comida' },
  { nombre: 'Enchiladas suizas', precio: 110.00, categoria: 'comida' },
  { nombre: 'Tiradito de atún', precio: 195.00, categoria: 'comida' },
  { nombre: 'Tostadas de ceviche', precio: 65.00, categoria: 'comida' },
  { nombre: 'Queso fundido', precio: 139.00, categoria: 'comida' },
  { nombre: 'Panini pollo al chipotle y pimientos', precio: 105.00, categoria: 'comida' },
  { nombre: 'Cheeseburger', precio: 115.00, categoria: 'comida' },
  { nombre: 'Cheeseburger con papas', precio: 135.00, categoria: 'comida' },
  { nombre: 'Hot dog', precio: 69.00, categoria: 'comida' },
  { nombre: 'Hot dog con papas', precio: 89.00, categoria: 'comida' },
  { nombre: 'Boneless', precio: 109.00, categoria: 'comida' },
  { nombre: 'Boneless con papas', precio: 129.00, categoria: 'comida' },
  { nombre: 'Dedos de queso', precio: 99.00, categoria: 'comida' },
  { nombre: 'Papas a la francesa', precio: 69.00, categoria: 'comida' },
  { nombre: 'Papas preparadas (queso y tocino)', precio: 89.00, categoria: 'comida' },
  { nombre: 'Tacos de bistec', precio: 110.00, categoria: 'comida' }
];

const DEUDAS = [
  { nombre: 'alejandro gutierrez', monto: 28.00 },
  { nombre: 'alejandro treviño', monto: 33.00 },
  { nombre: 'alfredo cabello', monto: 106.00 },
  { nombre: 'antonio lira', monto: 66.00 },
  { nombre: 'armando agüero', monto: 93.00 },
  { nombre: 'bonifacio', monto: 205.00 },
  { nombre: 'bufalo', monto: 197.00 },
  { nombre: 'camaron', monto: 229.00 },
  { nombre: 'castillo', monto: 438.00 },
  { nombre: 'cesar perez', monto: 937.00 },
  { nombre: 'chigarris perez', monto: 98.00 },
  { nombre: 'daniel galvan', monto: 143.00 },
  { nombre: 'doctor edgar', monto: 84.00 },
  { nombre: 'enrique cuevas', monto: 976.00 },
  { nombre: 'enrique moreno', monto: 33.00 },
  { nombre: 'Fernando del toro', monto: 444.00 },
  { nombre: 'Francisco gte', monto: 91.00 },
  { nombre: 'Francisco romero', monto: 100.00 },
  { nombre: 'Francisco valdez', monto: 991.00 },
  { nombre: 'gilberto vega', monto: 33.00 },
  { nombre: 'gustavo solis', monto: 124.00 },
  { nombre: 'hector cardenas', monto: 88.00 },
  { nombre: 'hernan quintanilla', monto: 240.00 },
  { nombre: 'jacobo', monto: 85.00 },
  { nombre: 'jesus santos', monto: 195.00 },
  { nombre: 'jose oropeza', monto: 40.00 },
  { nombre: 'juan pablo', monto: 75.00 },
  { nombre: 'kuess(hijo)', monto: 175.00 },
  { nombre: 'pablo trejo', monto: 123.00 },
  { nombre: 'ponce', monto: 120.00 },
  { nombre: 'profe reyna', monto: 58.00 },
  { nombre: 'raul galicia', monto: 113.00 },
  { nombre: 'revilla', monto: 149.00 },
  { nombre: 'rogelio sanchez', monto: 60.00 },
  { nombre: 'ruben carritos', monto: 38.00 },
  { nombre: 'toño marshall', monto: 120.00 },
  { nombre: 'ubaldo', monto: 200.00 }
];

async function main() {
  console.log('--- ACTUALIZANDO PRECIOS DE PRODUCTOS ---');

  // Listar áreas para configurar inventarios si agregamos productos nuevos
  const areasList = await prisma.area.findMany();
  const areaIds = areasList.map(a => a.id);

  let barcodeCounter = 200001;

  for (const item of PRECIOS) {
    // Buscar si ya existe por nombre (insensible a mayúsculas/minúsculas)
    const prods = await prisma.producto.findMany({
      where: {
        nombre: {
          equals: item.nombre
        }
      }
    });

    const precioDec = new Decimal(item.precio);

    if (prods.length > 0) {
      // Actualizar existente
      const prod = prods[0];
      await prisma.producto.update({
        where: { id: prod.id },
        data: {
          precio_venta: precioDec,
          categoria: item.categoria
        }
      });
      console.log(`Actualizado: ${prod.nombre} -> $${item.precio}`);
    } else {
      // Crear nuevo
      const nuevo = await prisma.producto.create({
        data: {
          nombre: item.nombre,
          precio_venta: precioDec,
          categoria: item.categoria,
          codigo_barras: `7502026${barcodeCounter++}`,
          activo: true
        }
      });
      console.log(`Creado nuevo producto: ${item.nombre} -> $${item.precio}`);

      // Configurar stock inicial en todas las áreas
      for (const areaId of areaIds) {
        await prisma.inventarioArea.upsert({
          where: {
            area_id_producto_id: {
              area_id: areaId,
              producto_id: nuevo.id
            }
          },
          update: {},
          create: {
            area_id: areaId,
            producto_id: nuevo.id,
            stock: new Decimal(20),
            stock_minimo: new Decimal(5),
            stock_maximo: new Decimal(50),
            ubicacion_estante: 'Almacén general'
          }
        });
      }
    }
  }

  console.log('--- ACTUALIZANDO DEUDAS Y SOCIOS ---');

  // Obtener usuario administrador para asignar las cuentas
  const admin = await prisma.usuario.findFirst({
    where: {
      roles: {
        some: {
          role: {
            nombre: 'ADMIN'
          }
        }
      }
    }
  });

  if (!admin) {
    console.error('No se encontró un usuario administrador en el sistema. Asegúrate de correr el seed base primero.');
    return;
  }

  // Asegurar que exista un área (e.g. Bar o Palapa)
  const defaultArea = areaIds[0] || 1;

  for (const deuda of DEUDAS) {
    // Buscar si existe el cliente
    let cliente = await prisma.cliente.findFirst({
      where: {
        nombre: {
          equals: deuda.nombre
        }
      }
    });

    if (!cliente) {
      // Crear cliente/socio
      const codigoSocio = `SOCIO-${deuda.nombre.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      cliente = await prisma.cliente.create({
        data: {
          nombre: deuda.nombre,
          codigo_socio: codigoSocio,
          activo: true
        }
      });
      console.log(`Creado socio: ${deuda.nombre} (${codigoSocio})`);
    } else {
      console.log(`Socio existente encontrado: ${cliente.nombre}`);
    }

    // Si el monto de la deuda es mayor a 0, registrar la deuda como divisionCuenta pendiente
    if (deuda.monto > 0) {
      // Borrar deudas anteriores del mismo socio creadas por importaciones previas para no duplicar deudas manuales
      await prisma.divisionCuenta.deleteMany({
        where: {
          cliente_id: cliente.id,
          metodo_pago: 'CARGO_SOCIO',
          estado_pago: 'PENDIENTE',
          cuenta: {
            nombre_referencia: 'CARGO INICIAL IMPORTADO'
          }
        }
      });

      // Crear cuenta cerrada y pagada con CARGO_SOCIO pendiente para el cliente
      const totalDec = new Decimal(deuda.monto);
      const cuenta = await prisma.cuenta.create({
        data: {
          area_id: defaultArea,
          usuario_id: admin.id,
          nombre_referencia: 'CARGO INICIAL IMPORTADO',
          estado: 'PAGADA',
          subtotal: totalDec,
          total: totalDec,
          metodo_pago: 'CARGO_SOCIO',
          closed_at: new Date()
        }
      });

      await prisma.divisionCuenta.create({
        data: {
          cuenta_id: cuenta.id,
          cliente_id: cliente.id,
          porcentaje_participacion: new Decimal(100),
          monto_proporcional: totalDec,
          metodo_pago: 'CARGO_SOCIO',
          estado_pago: 'PENDIENTE'
        }
      });

      console.log(`Deuda registrada para ${deuda.nombre}: $${deuda.monto}`);
    }
  }

  console.log('Proceso de actualización de precios y deudas finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

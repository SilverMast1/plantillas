const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Buscando Cliente Ivan Gonzales ---');
  const clientes = await prisma.cliente.findMany({
    where: {
      nombre: {
        contains: 'Ivan'
      }
    }
  });
  console.log('Clientes encontrados:', clientes);

  if (clientes.length === 0) {
    console.log('No se encontró ningún cliente con nombre que contenga "Ivan"');
    return;
  }

  const ivan = clientes[0];
  console.log('Buscando cuentas pendientes para:', ivan.nombre);
  
  // Buscar cuentas abiertas de este cliente
  const cuentas = await prisma.cuenta.findMany({
    where: {
      cliente_id: ivan.id,
      estado: 'ABIERTA'
    },
    include: {
      detalleCuentas: {
        include: {
          producto: true
        }
      }
    }
  });

  console.log('Cuentas encontradas:', JSON.stringify(cuentas, null, 2));

  if (cuentas.length === 0) {
    console.log('No se encontraron cuentas abiertas/pendientes para este cliente.');
    return;
  }

  // Buscar el producto "Huevos al gusto"
  let productoHuevos = await prisma.producto.findFirst({
    where: {
      nombre: {
        contains: 'Huevos'
      }
    }
  });

  console.log('Producto Huevos al gusto encontrado:', productoHuevos);

  if (!productoHuevos) {
    console.log('Creando producto "Huevos al gusto" ya que no existe...');
    productoHuevos = await prisma.producto.create({
      data: {
        nombre: 'Huevos al gusto',
        precio_venta: 95.00, // Usamos el precio del Platillo ($95)
        categoria: 'Comida'
      }
    });
    console.log('Creado:', productoHuevos);
  }

  // Actualizar el detalle de la cuenta
  for (const cuenta of cuentas) {
    const detallePlatillo = cuenta.detalleCuentas.find(d => d.producto.nombre.toLowerCase().includes('platillo'));
    if (detallePlatillo) {
      console.log('Encontrado detalle a cambiar:', detallePlatillo);
      
      // Actualizar el detalle_cuenta
      await prisma.detalleCuenta.update({
        where: {
          id: detallePlatillo.id
        },
        data: {
          producto_id: productoHuevos.id,
          // Mantenemos el precio_unitario si coincide, de lo contrario lo actualizamos
          precio_unitario: productoHuevos.precio_venta,
          subtotal: Number(detallePlatillo.cantidad) * Number(productoHuevos.precio_venta),
          total: Number(detallePlatillo.cantidad) * Number(productoHuevos.precio_venta)
        }
      });
      console.log('Detalle actualizado con éxito a Huevos al gusto!');
    }
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

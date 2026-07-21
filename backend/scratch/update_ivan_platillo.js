const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Actualizando Cuenta 1786 de Ivan Gonzales ---');
  
  // 1. Encontrar el producto "Huevos al gusto"
  const productoHuevos = await prisma.producto.findFirst({
    where: {
      nombre: {
        contains: 'Huevos'
      }
    }
  });

  if (!productoHuevos) {
    console.error('No se encontró el producto Huevos al gusto');
    return;
  }

  console.log('Producto Huevos al gusto:', productoHuevos);

  // 2. Actualizar el DetalleCuenta (ID 6446)
  const detalleActualizado = await prisma.detalleCuenta.update({
    where: { id: 6446 },
    data: {
      producto_id: productoHuevos.id,
      precio_unitario: productoHuevos.precio_venta,
      subtotal: Number(productoHuevos.precio_venta),
      total: Number(productoHuevos.precio_venta)
    }
  });
  console.log('Detalle de cuenta actualizado:', detalleActualizado);

  // Recalcular el subtotal y total de la cuenta
  const detalles = await prisma.detalleCuenta.findMany({
    where: { cuenta_id: 1786 }
  });

  let nuevoTotal = 0;
  for (const d of detalles) {
    nuevoTotal += Number(d.cantidad) * Number(d.precio_unitario);
  }
  console.log('Nuevo total calculado para la cuenta:', nuevoTotal);

  // 3. Actualizar la Cuenta
  const cuentaActualizada = await prisma.cuenta.update({
    where: { id: 1786 },
    data: {
      subtotal: nuevoTotal,
      total: nuevoTotal
    }
  });
  console.log('Cuenta actualizada:', cuentaActualizada);

  // 4. Actualizar la DivisionCuenta correspondiente a Ivan Gonzales
  const divisionActualizada = await prisma.divisionCuenta.updateMany({
    where: {
      cuenta_id: 1786,
      cliente_id: 103 // ID de IVAN GONZALES
    },
    data: {
      monto_proporcional: nuevoTotal
    }
  });
  console.log('Divisiones de cuenta actualizadas:', divisionActualizada);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

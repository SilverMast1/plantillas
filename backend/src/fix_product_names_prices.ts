import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

// Mapeo de nombre viejo -> nombre nuevo, precio nuevo y categoría nueva
const REGLAS_FUSION = [
  { viejo: 'Omelette', nuevo: 'Omelettes (jamon, chorizo o champiñones)', precio: 79.00, categoria: 'desayunos' },
  { viejo: 'Quesadillas', nuevo: 'Quesadillas Harina o maiz', precio: 24.00, categoria: 'desayunos' },
  { viejo: 'Molletes Especiales', nuevo: 'Molletes chorizo, chicharron o picadillo', precio: 89.00, categoria: 'desayunos' },
  { viejo: 'Panini de pollo al chipotle', nuevo: 'Panini pollo al chipotle y pimientos', precio: 105.00, categoria: 'comida' },
  { viejo: 'Tacos de fideo c/ chicharron', nuevo: 'Tacos de fideo con chicharrón', precio: 149.00, categoria: 'comida' },
  { viejo: 'Tostada de ceviche de pescado', nuevo: 'Tostadas de ceviche', precio: 65.00, categoria: 'comida' },
  { viejo: 'Arroz frito c/ verduras', nuevo: 'Arroz con verduras', precio: 49.00, categoria: 'comida' },
  { viejo: 'Taco de chicharron', nuevo: 'Taco de chicharron', precio: 28.00, categoria: 'tacos de guisos' },
  { viejo: 'Taco de choriqueso', nuevo: 'Taco de choriqueso', precio: 28.00, categoria: 'tacos de guisos' },
  { viejo: 'Taco de picadillo', nuevo: 'Taco de picadillo', precio: 24.00, categoria: 'tacos de guisos' },
  { viejo: 'Taco de huevo', nuevo: 'Taco de huevo con jamon', precio: 24.00, categoria: 'tacos de guisos' },
  { viejo: 'Taco de papa c/ chorizo', nuevo: 'Taco de papa con chorizo', precio: 24.00, categoria: 'tacos de guisos' },
];

async function main() {
  console.log('--- CORRIGIENDO PRECIOS Y FUSIONANDO DUPLICADOS ---');

  // 1. Eliminar "Huevos al gusto" para dejar solo los específicos "Huevos con jamon" y "Huevos con chorizo"
  const huevosAlGusto = await prisma.producto.findFirst({
    where: { nombre: { equals: 'Huevos al gusto' } }
  });
  if (huevosAlGusto) {
    console.log('Eliminando "Huevos al gusto" de inventarios y catálogo...');
    await prisma.inventarioArea.deleteMany({ where: { producto_id: huevosAlGusto.id } });
    await prisma.detalleCuenta.deleteMany({ where: { producto_id: huevosAlGusto.id } });
    await prisma.producto.delete({ where: { id: huevosAlGusto.id } });
  }

  // 2. Fusionar según las reglas de mapeo
  for (const regla of REGLAS_FUSION) {
    // Buscar si ya existe el nuevo producto
    const nuevoProd = await prisma.producto.findFirst({
      where: { nombre: { equals: regla.nuevo } }
    });

    // Buscar si existe el viejo producto
    const viejoProd = await prisma.producto.findFirst({
      where: { nombre: { equals: regla.viejo } }
    });

    const precioDec = new Decimal(regla.precio);

    if (nuevoProd && viejoProd && nuevoProd.id !== viejoProd.id) {
      // Si existen ambos, transferir dependencias del viejo al nuevo, y borrar el viejo
      console.log(`Fusionando "${regla.viejo}" (ID ${viejoProd.id}) en "${regla.nuevo}" (ID ${nuevoProd.id})...`);
      
      // Actualizar el nuevo producto con el precio y categoría correctos
      await prisma.producto.update({
        where: { id: nuevoProd.id },
        data: {
          precio_venta: precioDec,
          categoria: regla.categoria
        }
      });

      // Transferir registros de detalle de compras del viejo al nuevo para evitar romper el historial
      await prisma.detalleCuenta.updateMany({
        where: { producto_id: viejoProd.id },
        data: { producto_id: nuevoProd.id }
      });

      // Eliminar el viejo de inventarios y luego el producto
      await prisma.inventarioArea.deleteMany({ where: { producto_id: viejoProd.id } });
      await prisma.producto.delete({ where: { id: viejoProd.id } });

    } else if (viejoProd) {
      // Si solo existe el viejo, renombrarlo y actualizar precio
      console.log(`Renombrando "${regla.viejo}" a "${regla.nuevo}" con precio $${regla.precio}...`);
      await prisma.producto.update({
        where: { id: viejoProd.id },
        data: {
          nombre: regla.nuevo,
          precio_venta: precioDec,
          categoria: regla.categoria
        }
      });
    } else if (nuevoProd) {
      // Si solo existe el nuevo, actualizar su precio
      console.log(`Actualizando precio de "${regla.nuevo}" a $${regla.precio}...`);
      await prisma.producto.update({
        where: { id: nuevoProd.id },
        data: {
          precio_venta: precioDec,
          categoria: regla.categoria
        }
      });
    }
  }

  // 3. Verificar que todos los demás productos del menú CCL tengan los precios correctos
  const preciosRestantes = [
    { nombre: 'Huevos divorciados', precio: 85.00 },
    { nombre: 'Huevos con jamon', precio: 69.00 },
    { nombre: 'Huevos con chorizo', precio: 69.00 },
    { nombre: 'Chilaquiles', precio: 110.00 },
    { nombre: 'Taco de barbacoa', precio: 28.00 },
    { nombre: 'Fruta con yogurt', precio: 75.00 },
    { nombre: 'Chicharrón de ribeye', precio: 290.00 },
    { nombre: 'Enchiladas suizas', precio: 110.00 },
    { nombre: 'Tiradito de atún', precio: 195.00 },
    { nombre: 'Queso fundido', precio: 139.00 },
    { nombre: 'Cheeseburger', precio: 115.00 },
    { nombre: 'Cheeseburger con papas', precio: 135.00 },
    { nombre: 'Hot dog', precio: 69.00 },
    { nombre: 'Hot dog con papas', precio: 89.00 },
    { nombre: 'Boneless', precio: 109.00 },
    { nombre: 'Boneless con papas', precio: 129.00 },
    { nombre: 'Dedos de queso', precio: 99.00 },
    { font: 'Papas a la francesa', nombre: 'Papas a la francesa', precio: 69.00 },
    { nombre: 'Papas preparadas (queso y tocino)', precio: 89.00 },
    { nombre: 'Tacos de bistec', precio: 110.00 }
  ];

  for (const r of preciosRestantes) {
    const prod = await prisma.producto.findFirst({
      where: { nombre: { equals: r.nombre } }
    });
    if (prod) {
      await prisma.producto.update({
        where: { id: prod.id },
        data: { precio_venta: new Decimal(r.precio) }
      });
      console.log(`Verificado/Ajustado: ${prod.nombre} -> $${r.precio}`);
    }
  }

  console.log('--- CORRECCIÓN DE MENÚ FINALIZADA CON ÉXITO ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

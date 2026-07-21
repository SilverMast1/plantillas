import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Obteniendo datos de la base de datos local...');

  const roles = await prisma.role.findMany();
  const usuarios = await prisma.usuario.findMany();
  const usuarioRoles = await prisma.usuarioRole.findMany();
  const areas = await prisma.area.findMany();
  const clientes = await prisma.cliente.findMany();
  const cadis = await prisma.cadi.findMany();
  const productos = await prisma.producto.findMany();
  const inventarioAreas = await prisma.inventarioArea.findMany();
  const insumos = await prisma.insumo.findMany();
  const recetaIngredientes = await prisma.recetaIngrediente.findMany();

  console.log(`Roles: ${roles.length}`);
  console.log(`Usuarios: ${usuarios.length}`);
  console.log(`Áreas: ${areas.length}`);
  console.log(`Clientes/Socios: ${clientes.length}`);
  console.log(`Cadis: ${cadis.length}`);
  console.log(`Productos: ${productos.length}`);
  console.log(`Inventarios por área: ${inventarioAreas.length}`);
  console.log(`Insumos: ${insumos.length}`);
  console.log(`Recetas: ${recetaIngredientes.length}`);

  const seedContent = `import { PrismaClient } from '@prisma/client';
import prisma from './db';

async function main() {
  console.log('Iniciando carga de datos desde seed personalizado...');

  // Desactivar llaves foráneas en SQLite para la limpieza e inserción segura
  console.log('Desactivando llaves foráneas en SQLite...');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

  // Limpiar tablas para evitar duplicados / conflictos de claves primarias
  console.log('Limpiando tablas de base de datos...');
  await prisma.usuarioRole.deleteMany({});
  await prisma.inventarioArea.deleteMany({});
  await prisma.recetaIngrediente.deleteMany({});
  await prisma.divisionCuenta.deleteMany({});
  await prisma.detalleCuenta.deleteMany({});
  await prisma.cuenta.deleteMany({});
  await prisma.movimientoInventario.deleteMany({});
  await prisma.retiroCaja.deleteMany({});
  await prisma.turno.deleteMany({});
  await prisma.asignacionCadiCliente.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.insumo.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.cadi.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.usuario.deleteMany({});
  console.log('Limpieza completada');

  // 1. Roles
  console.log('Insertando roles...');
  await prisma.role.createMany({
    data: ${JSON.stringify(roles, null, 2)}
  });

  // 2. Usuarios
  console.log('Insertando usuarios...');
  await prisma.usuario.createMany({
    data: ${JSON.stringify(usuarios, null, 2)}
  });

  // 3. Usuario Roles
  console.log('Insertando roles de usuario...');
  await prisma.usuarioRole.createMany({
    data: ${JSON.stringify(usuarioRoles, null, 2)}
  });

  // 4. Áreas
  console.log('Insertando áreas...');
  await prisma.area.createMany({
    data: ${JSON.stringify(areas, null, 2)}
  });

  // 5. Clientes (Socios)
  console.log('Insertando clientes/socios...');
  await prisma.cliente.createMany({
    data: ${JSON.stringify(clientes, null, 2)}
  });

  // 6. Cadis
  console.log('Insertando cadis...');
  await prisma.cadi.createMany({
    data: ${JSON.stringify(cadis, null, 2)}
  });

  // 7. Productos
  console.log('Insertando productos...');
  await prisma.producto.createMany({
    data: ${JSON.stringify(productos, null, 2)}
  });

  // 8. Inventario por área
  console.log('Insertando inventario por área...');
  await prisma.inventarioArea.createMany({
    data: ${JSON.stringify(inventarioAreas, null, 2)}
  });

  // 9. Insumos
  console.log('Insertando insumos...');
  await prisma.insumo.createMany({
    data: ${JSON.stringify(insumos, null, 2)}
  });

  // 10. Recetas
  console.log('Insertando recetas...');
  await prisma.recetaIngrediente.createMany({
    data: ${JSON.stringify(recetaIngredientes, null, 2)}
  });

  // Activar llaves foráneas nuevamente
  console.log('Activando llaves foráneas de nuevo...');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');

  console.log('Seed ejecutado con éxito. Se importaron todos los catálogos y stock locales.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  const outputPath = path.join(__dirname, 'seed.ts');
  fs.writeFileSync(outputPath, seedContent);
  console.log('Archivo seed.ts sobrescrito exitosamente con los datos locales y soporte de FK.');
}

main()
  .catch((e) => {
    console.error('Error exportando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

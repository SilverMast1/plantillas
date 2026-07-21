import prisma from './db';
import * as fs from 'fs';
import * as path from 'path';

function fixEncoding(str: string | null | undefined): string | null {
  if (!str) return null;
  return str
    .replace(/├í/g, 'á')
    .replace(/├®/g, 'é')
    .replace(/├¡/g, 'í')
    .replace(/├│/g, 'ó')
    .replace(/├║/g, 'ú')
    .replace(/├▒/g, 'ñ')
    .replace(/├æ/g, 'Ñ')
    .replace(/├ü/g, 'Á')
    .replace(/├ë/g, 'É')
    .replace(/├═/g, 'Í')
    .replace(/├У/g, 'Ó')
    .replace(/├ó/g, 'â')
    .replace(/├┤/g, 'ô')
    .replace(/├╝/g, 'ü')
    .replace(/├┐/g, '¿')
    .replace(/├в/g, 'â');
}

async function fixDatabase() {
  console.log('--- INICIANDO CORRECCIÓN DE CODIFICACIÓN EN BD ---');

  // 1. Usuarios
  const usuarios = await prisma.usuario.findMany();
  for (const u of usuarios) {
    const fixedNombre = fixEncoding(u.nombre);
    if (fixedNombre && fixedNombre !== u.nombre) {
      await prisma.usuario.update({
        where: { id: u.id },
        data: { nombre: fixedNombre }
      });
      console.log(`Usuario ID ${u.id}: "${u.nombre}" -> "${fixedNombre}"`);
    }
  }

  // 2. Roles
  const roles = await prisma.role.findMany();
  for (const r of roles) {
    const fixedDesc = fixEncoding(r.descripcion);
    if (fixedDesc && fixedDesc !== r.descripcion) {
      await prisma.role.update({
        where: { id: r.id },
        data: { descripcion: fixedDesc }
      });
      console.log(`Rol ID ${r.id}: "${r.descripcion}" -> "${fixedDesc}"`);
    }
  }

  // 3. Areas
  const areas = await prisma.area.findMany();
  for (const a of areas) {
    const fixedDesc = fixEncoding(a.descripcion);
    if (fixedDesc && fixedDesc !== a.descripcion) {
      await prisma.area.update({
        where: { id: a.id },
        data: { descripcion: fixedDesc }
      });
      console.log(`Área ID ${a.id}: "${a.descripcion}" -> "${fixedDesc}"`);
    }
  }

  // 4. Productos
  const productos = await prisma.producto.findMany();
  for (const p of productos) {
    const fixedNombre = fixEncoding(p.nombre);
    const fixedDesc = fixEncoding(p.descripcion);
    const fixedCat = fixEncoding(p.categoria);
    
    const updateData: any = {};
    if (fixedNombre && fixedNombre !== p.nombre) updateData.nombre = fixedNombre;
    if (fixedDesc && fixedDesc !== p.descripcion) updateData.descripcion = fixedDesc;
    if (fixedCat && fixedCat !== p.categoria) updateData.categoria = fixedCat;

    if (Object.keys(updateData).length > 0) {
      await prisma.producto.update({
        where: { id: p.id },
        data: updateData
      });
      console.log(`Producto ID ${p.id}: "${p.nombre}" corregido`);
    }
  }

  // 5. Clientes
  const clientes = await prisma.cliente.findMany();
  for (const c of clientes) {
    const fixedNombre = fixEncoding(c.nombre);
    if (fixedNombre && fixedNombre !== c.nombre) {
      await prisma.cliente.update({
        where: { id: c.id },
        data: { nombre: fixedNombre }
      });
      console.log(`Cliente ID ${c.id}: "${c.nombre}" -> "${fixedNombre}"`);
    }
  }

  // 6. Insumos
  const insumos = await prisma.insumo.findMany();
  for (const i of insumos) {
    const fixedNombre = fixEncoding(i.nombre);
    if (fixedNombre && fixedNombre !== i.nombre) {
      await prisma.insumo.update({
        where: { id: i.id },
        data: { nombre: fixedNombre }
      });
      console.log(`Insumo ID ${i.id}: "${i.nombre}" -> "${fixedNombre}"`);
    }
  }

  // 7. InventarioArea (ubicacion_estante)
  const inventarios = await prisma.inventarioArea.findMany();
  for (const inv of inventarios) {
    const fixedUbicacion = fixEncoding(inv.ubicacion_estante);
    if (fixedUbicacion && fixedUbicacion !== inv.ubicacion_estante) {
      await prisma.inventarioArea.update({
        where: {
          area_id_producto_id: {
            area_id: inv.area_id,
            producto_id: inv.producto_id
          }
        },
        data: { ubicacion_estante: fixedUbicacion }
      });
      console.log(`Inventario Area ${inv.area_id} Prod ${inv.producto_id}: "${inv.ubicacion_estante}" -> "${fixedUbicacion}"`);
    }
  }

  // 8. Cuentas (nombre_referencia)
  const cuentas = await prisma.cuenta.findMany();
  for (const cu of cuentas) {
    const fixedRef = fixEncoding(cu.nombre_referencia);
    if (fixedRef && fixedRef !== cu.nombre_referencia) {
      await prisma.cuenta.update({
        where: { id: cu.id },
        data: { nombre_referencia: fixedRef }
      });
      console.log(`Cuenta ID ${cu.id}: "${cu.nombre_referencia}" -> "${fixedRef}"`);
    }
  }

  console.log('--- DB CORREGIDA EXITOSAMENTE ---');
}

function fixSeedFile() {
  console.log('--- CORRIGIENDO ARCHIVO SEED ---');
  const seedPath = path.join(__dirname, 'seed.ts');
  if (fs.existsSync(seedPath)) {
    const content = fs.readFileSync(seedPath, 'utf8');
    const fixedContent = fixEncoding(content);
    if (fixedContent) {
      fs.writeFileSync(seedPath, fixedContent, 'utf8');
      console.log('Archivo seed.ts corregido exitosamente.');
    }
  } else {
    console.log('No se encontró seed.ts');
  }
}

async function main() {
  fixSeedFile();
  await fixDatabase();
}

main().catch(console.error);

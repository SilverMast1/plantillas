import prisma from './db';

async function main() {
  console.log('Iniciando conversión de nombres de socios a MAYÚSCULAS...');
  const socios = await prisma.cliente.findMany();
  console.log(`Se encontraron ${socios.length} socios en total.`);

  let actualizados = 0;
  for (const socio of socios) {
    if (socio.nombre) {
      const nombreMayuscula = socio.nombre.trim().toUpperCase();
      if (nombreMayuscula !== socio.nombre) {
        await prisma.cliente.update({
          where: { id: socio.id },
          data: { nombre: nombreMayuscula },
        });
        actualizados++;
      }
    }
  }

  console.log(`Conversión completada. Se actualizaron ${actualizados} nombres de socios a MAYÚSCULAS.`);
}

main()
  .catch((e) => {
    console.error('Error durante la conversión:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

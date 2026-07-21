import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- BORRANDO TODOS LOS ADEUDOS / CARGOS A SOCIOS ---');

  // 1. Encontrar divisiones asociadas a deudas
  const divisionesABorrar = await prisma.divisionCuenta.findMany({
    where: {
      metodo_pago: 'CARGO_SOCIO'
    }
  });

  const cuentasIds = divisionesABorrar.map(d => d.cuenta_id);

  console.log(`Borrando ${divisionesABorrar.length} registros de deudas en divisiones...`);
  await prisma.divisionCuenta.deleteMany({
    where: {
      metodo_pago: 'CARGO_SOCIO'
    }
  });

  // Opcional: limpiar las cuentas asociadas que representan estos cargos de importación
  console.log('Limpiando cuentas asociadas de cargos...');
  await prisma.cuenta.deleteMany({
    where: {
      id: { in: cuentasIds },
      nombre_referencia: 'CARGO INICIAL IMPORTADO'
    }
  });

  console.log('--- SE BORRARON TODOS LOS ADEUDOS CON ÉXITO ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

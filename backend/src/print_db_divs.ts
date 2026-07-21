import { prisma } from './db';

async function main() {
  const dbDivs = await prisma.divisionCuenta.findMany({
    include: {
      cliente: true,
      cuenta: true
    }
  });

  console.log(`Total pending divisions: ${dbDivs.length}`);
  for (const div of dbDivs) {
    console.log(`Div ID: ${div.id} | Cuenta ID: ${div.cuenta_id} | Client ID: ${div.cliente_id} | Name: ${div.cliente?.nombre} | Socio Code: ${div.cliente?.codigo_socio} | Amount: ${div.monto_proporcional}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

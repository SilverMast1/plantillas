import prisma from './db';

async function adjust() {
  const activeShift = await prisma.turno.findFirst({
    where: { activo: true }
  });

  if (!activeShift) {
    console.log('No hay turno activo.');
    return;
  }

  const adjustment = await prisma.retiroCaja.create({
    data: {
      turno_id: activeShift.id,
      monto: 183,
      motivo: 'Ajuste de Caja (Cuadre Físico)',
      tipo: 'RETIRO'
    }
  });

  console.log(`Creado ajuste de retiro: ID ${adjustment.id}, monto $${adjustment.monto}, turno ID ${activeShift.id}`);
}

adjust().catch(console.error);

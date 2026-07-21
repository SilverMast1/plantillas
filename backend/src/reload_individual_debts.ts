import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

const DETALLE_DEUDAS = [
  { nombre: 'alejandro gutierrez', fecha: '2026-05-28', concepto: 'tecate', monto: 28.00 },
  { nombre: 'alejandro treviño', fecha: '2026-05-09', concepto: 'Consumo', monto: 33.00 },
  { nombre: 'alfredo cabello', fecha: '2026-05-23', concepto: 'coca y 3 tacos', monto: 106.00 },
  { nombre: 'antonio lira', fecha: '2026-06-16', concepto: '2 cocas', monto: 66.00 },
  { nombre: 'armando agüero', fecha: '2026-06-07', concepto: 'ams.power,japoneses', monto: 93.00 },
  { nombre: 'bonifacio', fecha: '2026-06-18', concepto: '5 tacos,ceviche', monto: 205.00 },
  { nombre: 'bufalo', fecha: '2026-06-13', concepto: '4 tacos,chicharrones,cacahuates,papas', monto: 197.00 },
  { nombre: 'camaron', fecha: '2026-06-16', concepto: 'chicharrones,2papas,3,refrescos,trad.rep', monto: 229.00 },
  { nombre: 'castillo', fecha: '2026-06-20', concepto: '5xlager,4cartas,capitan,bacardi,cacahuates,tkt', monto: 438.00 },
  
  // Cesar Perez Breakdown
  { nombre: 'cesar perez', fecha: '2026-06-18', concepto: 'agua,mpsnack,2 indio,3 papas,agua', monto: 371.00 },
  { nombre: 'cesar perez', fecha: '2026-06-19', concepto: 'mineral,2agua,2cocas,tkt,galletas', monto: 219.00 },
  { nombre: 'cesar perez', fecha: '2026-06-20', concepto: 'coca,4tacos,xx', monto: 175.00 },
  { nombre: 'cesar perez', fecha: '2026-06-21', concepto: 'agua,coca,huevos,(tacocadi)', monto: 172.00 },
  
  { nombre: 'chigarris perez', fecha: '2026-06-12', concepto: 'Consumo', monto: 98.00 },
  { nombre: 'daniel galvan', fecha: '2026-06-20', concepto: 'coca menudo', monto: 143.00 },
  { nombre: 'doctor edgar', fecha: '2026-06-04', concepto: 'Consumo', monto: 84.00 },
  { nombre: 'enrique cuevas', fecha: '2026-06-20', concepto: 'consumo del dia y ronda', monto: 976.00 },
  { nombre: 'enrique moreno', fecha: '2026-06-11', concepto: 'refresco en snack', monto: 33.00 },
  
  // Fernando del toro Breakdown
  { nombre: 'Fernando del toro', fecha: '2026-06-06', concepto: 'refresco,ams,tacos,refresco', monto: 181.00 },
  { nombre: 'Fernando del toro', fecha: '2026-06-13', concepto: 'miller,agua1l,tecate,2bacardi,papas,cacahuates', monto: 263.00 },
  
  { nombre: 'Francisco gte', fecha: '2026-06-16', concepto: '2 cocas,papas', monto: 91.00 },
  { nombre: 'Francisco romero', fecha: '2026-06-07', concepto: 'cigarros caja', monto: 100.00 },
  
  // Francisco valdez Breakdown
  { nombre: 'Francisco valdez', fecha: '2026-05-09', concepto: 'coca', monto: 33.00 },
  { nombre: 'Francisco valdez', fecha: '2026-06-17', concepto: 'consumo', monto: 958.00 },
  
  { nombre: 'gilberto vega', fecha: '2026-06-16', concepto: 'coca', monto: 33.00 },
  { nombre: 'gustavo solis', fecha: '2026-06-19', concepto: '2aguas,4tacos', monto: 124.00 },
  
  // Hector Cardenas Breakdown
  { nombre: 'hector cardenas', fecha: '2026-06-19', concepto: 'tecate', monto: 28.00 },
  { nombre: 'hector cardenas', fecha: '2026-06-19', concepto: 'chelada,chicharrones', monto: 60.00 },
  
  { nombre: 'hernan quintanilla', fecha: '2026-06-18', concepto: 'agua,4tacos,chocolate,2cocsas', monto: 240.00 },
  { nombre: 'jacobo', fecha: '2026-06-13', concepto: 'huevos div', monto: 85.00 },
  { nombre: 'jesus santos', fecha: '2026-06-17', concepto: '5 tacos,2cocas,agus', monto: 195.00 },
  { nombre: 'jose oropeza', fecha: '2026-06-18', concepto: 'agua', monto: 40.00 },
  { nombre: 'juan pablo', fecha: '2026-06-17', concepto: 'monster,agua', monto: 75.00 },
  { nombre: 'kuess(hijo)', fecha: '2026-06-18', concepto: 'mineral,vodka', monto: 175.00 },
  { nombre: 'pablo trejo', fecha: '2026-06-19', concepto: 'huevos divorciados,power', monto: 123.00 },
  { nombre: 'ponce', fecha: '2026-06-14', concepto: 'maestro dobel.prep', monto: 120.00 },
  { nombre: 'profe reyna', fecha: '2026-05-06', concepto: 'indio y carta', monto: 58.00 },
  { nombre: 'raul galicia', fecha: '2026-06-13', concepto: 'coca,3 tacos', monto: 113.00 },
  { nombre: 'revilla', fecha: '2026-06-21', concepto: 'coca,2tkt,papas,ams', monto: 149.00 },
  { nombre: 'rogelio sanchez', fecha: '2026-06-13', concepto: 'chicharrones,galletas', monto: 60.00 },
  { nombre: 'ruben carritos', fecha: '2026-06-20', concepto: 'ppower', monto: 38.00 },
  { nombre: 'toño marshall', fecha: '2026-06-20', concepto: '4 cartas', monto: 120.00 },
  { nombre: 'ubaldo', fecha: '2026-06-17', concepto: '2 tostadas,2mineral', monto: 200.00 }
];

async function main() {
  console.log('--- REESTABLECIENDO TODOS LOS CARGOS A SOCIOS ---');

  // 1. Obtener todas las cuentas creadas como importación
  const cuentasImportadas = await prisma.cuenta.findMany({
    where: {
      nombre_referencia: 'CARGO INICIAL IMPORTADO'
    }
  });
  const cuentasIds = cuentasImportadas.map(c => c.id);

  console.log(`Borrando ${cuentasIds.length} divisiones de cuentas importadas...`);
  await prisma.divisionCuenta.deleteMany({
    where: {
      cuenta_id: { in: cuentasIds }
    }
  });

  console.log('Borrando cuentas de cargo inicial importado...');
  await prisma.cuenta.deleteMany({
    where: {
      id: { in: cuentasIds }
    }
  });

  // 2. Obtener usuario administrador e identificadores de áreas
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
    console.error('Error: Se necesita un administrador en la BD.');
    return;
  }

  const areas = await prisma.area.findMany();
  const defaultArea = areas[0]?.id || 1;

  // 3. Insertar cada cargo de forma individual con su fecha y concepto real
  for (const cargo of DETALLE_DEUDAS) {
    // Buscar el socio
    let socio = await prisma.cliente.findFirst({
      where: {
        nombre: {
          equals: cargo.nombre
        }
      }
    });

    if (!socio) {
      // Crear socio si no existiera
      const codigoSocio = `SOCIO-${cargo.nombre.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      socio = await prisma.cliente.create({
        data: {
          nombre: cargo.nombre,
          codigo_socio: codigoSocio,
          activo: true
        }
      });
      console.log(`Socio no encontrado. Creado: ${cargo.nombre} (${codigoSocio})`);
    }

    const totalDec = new Decimal(cargo.monto);
    const fechaCargo = new Date(cargo.fecha);

    // Crear cuenta con el detalle específico del consumo
    const cuenta = await prisma.cuenta.create({
      data: {
        area_id: defaultArea,
        usuario_id: admin.id,
        nombre_referencia: 'CARGO INICIAL IMPORTADO',
        estado: 'PAGADA',
        subtotal: totalDec,
        total: totalDec,
        metodo_pago: 'CARGO_SOCIO',
        created_at: fechaCargo,
        closed_at: fechaCargo
      }
    });

    // Crear división para el socio
    await prisma.divisionCuenta.create({
      data: {
        cuenta_id: cuenta.id,
        cliente_id: socio.id,
        porcentaje_participacion: new Decimal(100),
        monto_proporcional: totalDec,
        metodo_pago: 'CARGO_SOCIO',
        estado_pago: 'PENDIENTE',
        pagado_at: null // Pendiente de pago
      }
    });

    console.log(`Registrado Cargo Individual: ${socio.nombre} | ${cargo.concepto} | $${cargo.monto} | Fecha: ${cargo.fecha}`);
  }

  console.log('--- RECARGA DE ADEUDOS COMPLETADA CON ÉXITO ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

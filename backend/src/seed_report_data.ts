import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

const MOVIMIENTOS = [
  // --- Martes 16 de Junio 2026 ---
  { fecha: '2026-06-16', tipo: 'GASTO_MATERIAL', concepto: 'PAPITAS', monto: 360.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-16', tipo: 'GASTO_MATERIAL', concepto: 'LIMON', monto: 65.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-16', tipo: 'GASTO_MATERIAL', concepto: 'PAPITAS', monto: 792.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-16', tipo: 'GASTO_MATERIAL', concepto: 'COCA COLA', monto: 200.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-16', tipo: 'GASTO_MATERIAL', concepto: 'MONSTER', monto: 250.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-16', tipo: 'GASTO_MATERIAL', concepto: 'Vinos', monto: 660.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-16', tipo: 'GASTO_MATERIAL', concepto: 'GALLETAS', monto: 500.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-16', tipo: 'INGRESO', concepto: 'Ingreso efevo', monto: 7872.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-16', tipo: 'INGRESO', concepto: 'Deposito Banregio', monto: 425.00, metodo: 'BANREGIO' },

  // --- Miércoles 17 de Junio 2026 ---
  { fecha: '2026-06-17', tipo: 'GASTO_VARIABLE', concepto: 'VASOS LITRO PLASTICO', monto: 365.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_VARIABLE', concepto: 'BOLSA BASURA', monto: 417.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_VARIABLE', concepto: 'VASOS LITRO PLASTICO', monto: 107.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_VARIABLE', concepto: 'Taxi', monto: 50.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'VERDURA', monto: 196.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'PAN BLANCO', monto: 66.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'CARNE DE RES', monto: 367.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'TORTILLAS DE MAIZ', monto: 60.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'HIELO', monto: 90.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'CARNE DE RES', monto: 310.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'CHOCOLATES', monto: 400.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'COCA COLA', monto: 1650.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'TEQUILA CENTENARIO PLATA', monto: 630.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'AGUA', monto: 270.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'Vinos', monto: 2383.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'GASTO_MATERIAL', concepto: 'PECHUGA DE POLLO', monto: 725.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-17', tipo: 'INGRESO', concepto: 'Ingreso efevo', monto: 9068.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-17', tipo: 'INGRESO', concepto: 'Ingreso Banregio', monto: 8086.00, metodo: 'BANREGIO' },

  // --- Jueves 18 de Junio 2026 ---
  { fecha: '2026-06-18', tipo: 'GASTO_MATERIAL', concepto: 'VERDURA', monto: 1159.71, metodo: 'BANREGIO' },
  { fecha: '2026-06-18', tipo: 'GASTO_MATERIAL', concepto: 'SALSA MEXICO', monto: 36.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-18', tipo: 'GASTO_MATERIAL', concepto: 'CEBOLLA', monto: 47.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-18', tipo: 'GASTO_MATERIAL', concepto: 'PAN BLANCO', monto: 25.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-18', tipo: 'GASTO_MATERIAL', concepto: 'CIGARROS', monto: 2108.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-18', tipo: 'INGRESO', concepto: 'Ingreso efevo', monto: 9573.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-18', tipo: 'INGRESO', concepto: 'Ingreso Banregio', monto: 3375.71, metodo: 'BANREGIO' },

  // --- Viernes 19 de Junio 2026 ---
  { fecha: '2026-06-19', tipo: 'GASTO_VARIABLE', concepto: 'BOLSA TRANSPARENTE', monto: 123.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'GASTO_VARIABLE', concepto: 'Taxi', monto: 290.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'GASTO_MATERIAL', concepto: 'AGUA', monto: 77.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'GASTO_MATERIAL', concepto: 'PEPINILLOS', monto: 107.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'GASTO_MATERIAL', concepto: 'ELECTROLIT', monto: 132.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'GASTO_MATERIAL', concepto: 'HIELO', monto: 139.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'GASTO_MATERIAL', concepto: 'MAYONESA', monto: 128.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'GASTO_MATERIAL', concepto: 'CLAMATO', monto: 155.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'GASTO_MATERIAL', concepto: 'CERVEZA', monto: 720.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-19', tipo: 'INGRESO', concepto: 'Ingreso efevo', monto: 12464.00, metodo: 'EFECTIVO' },
  { fecha: '2026-06-19', tipo: 'INGRESO', concepto: 'Ingreso Banregio', monto: 1871.00, metodo: 'BANREGIO' },

  // --- Sábado 20 de Junio 2026 ---
  { fecha: '2026-06-20', tipo: 'GASTO_VARIABLE', concepto: 'VASOS LITRO PLASTICO', monto: 288.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_VARIABLE', concepto: 'FABULOSO', monto: 125.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_VARIABLE', concepto: 'CANASTAS ROJAS', monto: 140.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'Michelada', monto: 250.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'PAPAS A LA FRANCESA', monto: 500.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'CERVEZA', monto: 500.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'CARNE DE RES', monto: 577.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'CHILE CHIPOTLE', monto: 65.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'JALAPEÑOS EN VINAGRE', monto: 51.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'HIELO', monto: 74.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'CREMA LALA', monto: 83.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'ELECTROLIT', monto: 90.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'TOMATE DEL FUERTE', monto: 162.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'PAN BLANCO', monto: 482.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'CHORIZO', monto: 173.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'QUESO CREMA', monto: 327.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'COCA COLA', monto: 277.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'SAL', monto: 164.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'PAPITAS', monto: 380.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'CLAMATO', monto: 155.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'CHOCOLATES', monto: 115.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'VERDURA', monto: 290.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'CERVEZA', monto: 1773.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'LIMON', monto: 173.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'COCA COLA', monto: 28.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'HIELO', monto: 221.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'Vinos', monto: 1122.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'GASTO_MATERIAL', concepto: 'PAPITAS', monto: 630.00, metodo: 'BANREGIO' },
  { fecha: '2026-06-20', tipo: 'INGRESO', concepto: 'Ingreso efevo', monto: 38977.00, metodo: 'EFECTIVO' }
];

async function main() {
  console.log('--- SEMBRANDO DATOS DE REPORTE SEMANAL ---');

  // Limpiar movimientos semanales previos para evitar duplicados
  await prisma.gastoIngresoCCL.deleteMany({});

  for (const m of MOVIMIENTOS) {
    await prisma.gastoIngresoCCL.create({
      data: {
        fecha: new Date(m.fecha),
        tipo_registro: m.tipo,
        concepto: m.concepto,
        monto: new Decimal(m.monto),
        metodo_pago: m.metodo
      }
    });
  }

  console.log('Datos semanales sembrados exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

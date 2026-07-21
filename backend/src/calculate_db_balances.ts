import * as XLSX from 'xlsx';
import { prisma } from './db';
import { Decimal } from 'decimal.js';

async function main() {
  const excelPath = 'C:\\Users\\SERGIO\\OneDrive\\Escritorio\\adeudos socios.xlsx';
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['Socios'];
  const excelRows = XLSX.utils.sheet_to_json<any>(sheet);

  console.log(`Excel total rows: ${excelRows.length}`);
  
  // Calculate Excel total sum
  let excelTotal = 0;
  for (const row of excelRows) {
    excelTotal += Number(row.SALDO || 0);
  }
  console.log(`Excel Total: ${excelTotal}`);

  // Fetch all clients in system who have pending cargos
  const dbClients = await prisma.cliente.findMany({
    include: {
      divisionesCuentas: {
        where: {
          metodo_pago: 'CARGO_SOCIO',
          estado_pago: 'PENDIENTE'
        }
      }
    }
  });

  // Filter clients who have pending balance
  const clientsWithBalance = dbClients.map(c => {
    const balance = c.divisionesCuentas.reduce(
      (sum, div) => sum.plus(new Decimal(div.monto_proporcional)),
      new Decimal(0)
    ).toNumber();
    return {
      id: c.id,
      codigo_socio: c.codigo_socio,
      nombre: c.nombre,
      balance,
      divIds: c.divisionesCuentas.map(d => d.id)
    };
  }).filter(c => c.balance > 0);

  const dbTotal = clientsWithBalance.reduce((sum, c) => sum + c.balance, 0);
  console.log(`DB Total cargos: ${dbTotal} (Count: ${clientsWithBalance.length})`);

  console.log('\n--- Comparing Client by Client ---');
  let diffSum = 0;
  for (const dbC of clientsWithBalance) {
    // Look up in excel rows
    // Excel row 'CÓDIGO' could be a number matching the number in dbC.codigo_socio (e.g. 'SOCIO-3' matches '3' or 'SOCIO-ALE-328' matches 'ALE-328')
    const excelMatch = excelRows.find(row => {
      const excelCode = String(row['CÓDIGO']).trim();
      const excelName = String(row['SOCIO']).trim().toUpperCase();
      const dbNameNormalized = dbC.nombre.trim().toUpperCase();

      const cleanDbCode = (dbC.codigo_socio || '').replace('SOCIO-', '').replace('EMPLEADO-', '').trim();
      
      if (cleanDbCode === excelCode) return true;
      if (dbNameNormalized === excelName) return true;
      return false;
    });

    const excelSaldo = excelMatch ? Number(excelMatch.SALDO || 0) : 0;
    const diff = dbC.balance - excelSaldo;

    if (diff !== 0) {
      console.log(`Mismatch: Name: ${dbC.nombre} | Code: ${dbC.codigo_socio} | DB Balance: ${dbC.balance} | Excel Saldo: ${excelSaldo} | Diff: ${diff} | Div IDs: ${dbC.divIds.join(',')}`);
      diffSum += diff;
    }
  }

  console.log(`\nTotal sum of differences: ${diffSum}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

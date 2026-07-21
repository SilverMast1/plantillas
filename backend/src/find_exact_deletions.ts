import * as XLSX from 'xlsx';
import { prisma } from './db';
import { Decimal } from 'decimal.js';

async function main() {
  const excelPath = 'C:\\Users\\SERGIO\\OneDrive\\Escritorio\\adeudos socios.xlsx';
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['Socios'];
  const excelRows = XLSX.utils.sheet_to_json<any>(sheet);

  // Map of excel Código to Saldo
  const excelMap = new Map<string, number>();
  for (const row of excelRows) {
    const code = String(row['CÓDIGO']).trim();
    const saldo = Number(row.SALDO || 0);
    excelMap.set(code, saldo);
  }

  // Fetch all clients with pending cargos
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

  console.log('--- Client Balances Analysis ---');
  let totalDb = 0;
  const extraDivisions: { id: number; name: string; socioCode: string; amount: number }[] = [];

  for (const client of dbClients) {
    const balance = client.divisionesCuentas.reduce(
      (sum, div) => sum.plus(new Decimal(div.monto_proporcional)),
      new Decimal(0)
    ).toNumber();

    if (balance === 0) continue;
    totalDb += balance;

    // Try to match the client to an Excel row
    // 1. By extraction of numeric code from socioCode (e.g. "SOCIO-3" -> "3", "SOCIO-ALE-328" -> "ALE-328")
    const codeNum = client.codigo_socio ? client.codigo_socio.replace('SOCIO-', '').replace('EMPLEADO-', '').trim() : '';
    let excelSaldo = excelMap.get(codeNum);

    if (excelSaldo === undefined) {
      // 2. Try match by name
      const nameNorm = client.nombre.trim().toUpperCase();
      const excelRowByName = excelRows.find(row => String(row.SOCIO || '').trim().toUpperCase() === nameNorm);
      if (excelRowByName) {
        excelSaldo = Number(excelRowByName.SALDO || 0);
      }
    }

    if (excelSaldo === undefined) {
      // Not found in Excel at all!
      console.log(`NOT IN EXCEL: ${client.nombre} (${client.codigo_socio}) | DB Balance: ${balance} | Marking all for deletion`);
      for (const div of client.divisionesCuentas) {
        extraDivisions.push({ id: div.id, name: client.nombre, socioCode: client.codigo_socio || '', amount: Number(div.monto_proporcional) });
      }
    } else if (balance > excelSaldo) {
      // DB has more balance than Excel
      const excess = balance - excelSaldo;
      console.log(`EXCESS BALANCE: ${client.nombre} (${client.codigo_socio}) | DB Balance: ${balance} | Excel Saldo: ${excelSaldo} | Excess: ${excess}`);
      
      // Let's identify which divisions to delete to match Excel
      // We can sort divisions descending or ascending and find a combination, or if Excel saldo is 0, delete all of them.
      if (excelSaldo === 0) {
        console.log(`  -> Excel is 0. Deleting all divisions: ${client.divisionesCuentas.map(d => d.id).join(', ')}`);
        for (const div of client.divisionesCuentas) {
          extraDivisions.push({ id: div.id, name: client.nombre, socioCode: client.codigo_socio || '', amount: Number(div.monto_proporcional) });
        }
      } else {
        // If Excel saldo is not 0 but DB is larger, let's see which divisions match the excess
        console.log(`  -> Excel is ${excelSaldo}. Need to reduce by ${excess}.`);
        // Let's print the divisions of this client so we can decide
        for (const div of client.divisionesCuentas) {
          console.log(`     - Division ID: ${div.id} | Amount: ${div.monto_proporcional}`);
        }
      }
    }
  }

  // Also check direct accounts (DEUDAS area)
  const dbDirectDebts = await prisma.cuenta.findMany({
    where: {
      estado: 'ABIERTA',
      area: {
        nombre: 'DEUDAS'
      },
      divisionesCuentas: {
        none: {}
      }
    },
    include: {
      cliente: true
    }
  });

  for (const c of dbDirectDebts) {
    const codeNum = c.cliente?.codigo_socio ? c.cliente.codigo_socio.replace('SOCIO-', '').replace('EMPLEADO-', '').trim() : '';
    let excelSaldo = excelMap.get(codeNum);
    const balance = Number(c.total);
    totalDb += balance;

    if (excelSaldo === undefined && c.cliente) {
      const nameNorm = c.cliente.nombre.trim().toUpperCase();
      const excelRowByName = excelRows.find(row => String(row.SOCIO || '').trim().toUpperCase() === nameNorm);
      if (excelRowByName) {
        excelSaldo = Number(excelRowByName.SALDO || 0);
      }
    }

    if (excelSaldo === undefined) {
      console.log(`DIRECT ACCT NOT IN EXCEL: Account ID ${c.id} | Socio: ${c.cliente?.codigo_socio} | Name: ${c.cliente?.nombre} | DB Balance: ${balance} | Marking for deletion`);
      // We will delete this direct account
    } else if (balance > excelSaldo) {
      const excess = balance - excelSaldo;
      console.log(`DIRECT ACCT EXCESS: Account ID ${c.id} | Socio: ${c.cliente?.codigo_socio} | Name: ${c.cliente?.nombre} | DB Balance: ${balance} | Excel Saldo: ${excelSaldo} | Excess: ${excess}`);
    }
  }

  console.log(`\nDB Total Debt: ${totalDb}`);
  const totalExtraAmount = extraDivisions.reduce((sum, d) => sum + d.amount, 0);
  console.log(`Total amount marked for deletion: ${totalExtraAmount}`);
  console.log('Extra Divisions:', extraDivisions);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

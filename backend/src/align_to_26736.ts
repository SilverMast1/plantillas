import * as XLSX from 'xlsx';
import { prisma } from './db';
import { Decimal } from 'decimal.js';

async function main() {
  const excelPath = 'C:\\Users\\SERGIO\\Desktop\\adeudossocios.xlsm';
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['Hoja1'];
  const excelRows = XLSX.utils.sheet_to_json<any>(sheet);

  console.log(`Excel total rows: ${excelRows.length}`);

  // We need to build a map of Excel Name normalized -> Excel Total Deuda
  // Since a client can have multiple rows or we need to extract from multiple columns:
  // Let's sum the 'total de deuda' or 'total de deudas' or 'adeudo' for each unique name.
  // Wait, in the spreadsheet, if a name is repeated, does it mean we should sum them?
  // Let's check: Yes! For Hector Cardenas, he has two rows: one with 45 and one with 224.
  // So we should group by name and sum the final column value (total de deudas or total de deuda) for each row!
  // Wait, let's look at the columns:
  // For each row, the client's debt is row['total de deuda'] || row['total de deudas'] || row.adeudo || 0.
  // Let's group and sum this for each unique name!
  const excelBalances = new Map<string, number>();
  for (const row of excelRows) {
    if (!row.nombre) continue;
    const name = String(row.nombre).trim().toUpperCase();
    const val = Number(row['total de deudas'] || row['total de deuda'] || row.adeudo || 0);
    
    // In this sheet, each row represents one debt entry. If a person has multiple rows, we sum them!
    if (!excelBalances.has(name)) {
      excelBalances.set(name, 0);
    }
    excelBalances.set(name, excelBalances.get(name)! + val);
  }

  console.log(`Unique clients in Excel: ${excelBalances.size}`);
  
  // Calculate total Excel sum
  let excelTotal = 0;
  for (const [name, bal] of excelBalances.entries()) {
    excelTotal += bal;
    console.log(`Excel Client: ${name} | Balance: ${bal}`);
  }
  console.log(`Excel Calculated Total: ${excelTotal}`);

  // Fetch all pending cargos from DB
  const dbDivs = await prisma.divisionCuenta.findMany({
    where: {
      estado_pago: 'PENDIENTE',
      metodo_pago: 'CARGO_SOCIO'
    },
    include: {
      cliente: true
    }
  });

  const dbDirect = await prisma.cuenta.findMany({
    where: {
      estado: 'ABIERTA',
      area: { nombre: 'DEUDAS' },
      divisionesCuentas: { none: {} }
    },
    include: { cliente: true }
  });

  // Group DB by client name normalized
  const dbClientBalances = new Map<string, { divs: typeof dbDivs; directs: typeof dbDirect }>();

  for (const div of dbDivs) {
    if (!div.cliente) continue;
    const name = div.cliente.nombre.trim().toUpperCase();
    if (!dbClientBalances.has(name)) {
      dbClientBalances.set(name, { divs: [], directs: [] });
    }
    dbClientBalances.get(name)!.divs.push(div);
  }

  for (const c of dbDirect) {
    if (!c.cliente) continue;
    const name = c.cliente.nombre.trim().toUpperCase();
    if (!dbClientBalances.has(name)) {
      dbClientBalances.set(name, { divs: [], directs: [] });
    }
    dbClientBalances.get(name)!.directs.push(c);
  }

  console.log('\n--- Aligning DB to Excel ---');

  await prisma.$transaction(async (tx) => {
    // 1. Process all database clients
    for (const [dbName, data] of dbClientBalances.entries()) {
      const excelSaldo = excelBalances.get(dbName) ?? 0;
      
      const currentDbBal = data.divs.reduce((sum, d) => sum.plus(new Decimal(d.monto_proporcional)), new Decimal(0))
        .plus(data.directs.reduce((sum, c) => sum.plus(new Decimal(c.total)), new Decimal(0)))
        .toNumber();

      if (currentDbBal === excelSaldo) {
        continue;
      }

      console.log(`Mismatch: ${dbName} | DB: ${currentDbBal} | Excel: ${excelSaldo}`);

      if (excelSaldo === 0) {
        // Delete all divisions and direct accounts for this client
        for (const div of data.divs) {
          console.log(`  -> Deleting Division ID: ${div.id} (Amount: ${div.monto_proporcional})`);
          await tx.divisionCuenta.delete({ where: { id: div.id } });
        }
        for (const c of data.directs) {
          console.log(`  -> Deleting Direct Cuenta ID: ${c.id} (Amount: ${c.total})`);
          await tx.divisionCuenta.deleteMany({ where: { cuenta_id: c.id } });
          await tx.detalleCuenta.deleteMany({ where: { cuenta_id: c.id } });
          await tx.cuenta.delete({ where: { id: c.id } });
        }
      } else {
        // DB balance is different from Excel. We adjust to match excelSaldo!
        // We will adjust the first division/direct account, and delete the rest if any.
        let remaining = new Decimal(excelSaldo);

        // Process divisions first
        for (let i = 0; i < data.divs.length; i++) {
          const div = data.divs[i];
          if (i === 0) {
            console.log(`  -> Updating Division ID: ${div.id} to Amount: ${remaining.toNumber()}`);
            await tx.divisionCuenta.update({
              where: { id: div.id },
              data: {
                monto_proporcional: remaining.toNumber()
              }
            });
            remaining = new Decimal(0);
          } else {
            console.log(`  -> Deleting extra Division ID: ${div.id} (Amount: ${div.monto_proporcional})`);
            await tx.divisionCuenta.delete({ where: { id: div.id } });
          }
        }

        // Process direct accounts if remaining > 0 (or delete them if already met the target)
        for (let i = 0; i < data.directs.length; i++) {
          const c = data.directs[i];
          if (remaining.greaterThan(0)) {
            console.log(`  -> Updating Direct Cuenta ID: ${c.id} to Amount: ${remaining.toNumber()}`);
            await tx.cuenta.update({
              where: { id: c.id },
              data: {
                total: remaining.toNumber(),
                subtotal: remaining.toNumber()
              }
            });
            remaining = new Decimal(0);
          } else {
            console.log(`  -> Deleting extra Direct Cuenta ID: ${c.id} (Amount: ${c.total})`);
            await tx.divisionCuenta.deleteMany({ where: { cuenta_id: c.id } });
            await tx.detalleCuenta.deleteMany({ where: { cuenta_id: c.id } });
            await tx.cuenta.delete({ where: { id: c.id } });
          }
        }
      }
    }
  });

  console.log('\nDatabase alignment applied successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

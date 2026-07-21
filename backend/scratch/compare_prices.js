const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
  const dbProducts = await prisma.producto.findMany({
    where: { activo: true }
  });

  const filePath = 'C:\\Users\\SERGIO\\Desktop\\PRECIOS CCL.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const excelRows = xlsx.utils.sheet_to_json(sheet);

  console.log('Comparing Excel to DB active products:\n');

  // Normalize text function
  function normalize(str) {
    if (!str) return '';
    return str.toString()
      .toLowerCase()
      .replace(/[\s\-\(\)\.,]/g, '')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  for (const row of excelRows) {
    const rawName = row['PRECIOS PLATILLOS CCL'];
    const excelPrice = parseFloat(row['__EMPTY']);
    if (!rawName) continue;

    const normExcelName = normalize(rawName);

    // Find in DB
    const match = dbProducts.find(p => {
      return normalize(p.nombre) === normExcelName || 
             normalize(p.nombre).includes(normExcelName) || 
             normExcelName.includes(normalize(p.nombre));
    });

    if (match) {
      const dbPrice = parseFloat(match.precio_venta.toString());
      if (dbPrice !== excelPrice) {
        console.log(`Mismatch price for "${match.nombre}" (ID: ${match.id}): DB price = ${dbPrice}, Excel price = ${excelPrice} (Excel row: "${rawName}")`);
      } else {
        console.log(`Match ok: "${match.nombre}" = ${dbPrice}`);
      }
    } else {
      console.log(`No direct match found in DB for Excel row: "${rawName}" (Price: ${excelPrice})`);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);

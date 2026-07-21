const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const files = [
  'INVENTARIO.xlsx',
  'PRECIOS CCL.xlsx',
  'Recetas y Platillos CCLourdes.xlsx',
  'REPORTE CCLOURDES SEM4.xlsx',
  'REPORTE CCLOURDES.xlsx'
];

files.forEach(file => {
  const filePath = path.join('C:\\Users\\SERGIO\\Desktop', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  console.log(`\n=== Analyzing ${file} ===`);
  try {
    const workbook = xlsx.readFile(filePath);
    console.log('Sheets:', workbook.SheetNames);
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:A1');
      console.log(`Sheet: ${sheetName}, Range: ${sheet['!ref']}, Rows: ${range.e.r + 1}, Cols: ${range.e.c + 1}`);
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 5);
      console.log('First 5 rows:');
      console.log(data);
    });
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});

const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\SERGIO\\Desktop\\INVENTARIO.xlsx';
const workbook = xlsx.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  // print all rows but only column 0
  const products = data.map(row => row[0] || row[1]).filter(val => val && typeof val === 'string' && val.trim().length > 0 && !val.includes('INVENTARIO') && !val.includes('PRODUCTO'));
  console.log(JSON.stringify(products, null, 2));
});

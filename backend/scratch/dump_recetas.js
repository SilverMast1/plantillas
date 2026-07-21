const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\SERGIO\\Desktop\\Recetas y Platillos CCLourdes.xlsx';
const workbook = xlsx.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  // print first 10 rows
  console.log(JSON.stringify(data.slice(0, 15), null, 2));
});

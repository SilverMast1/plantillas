const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\SERGIO\\Desktop\\PRECIOS CCL.xlsx';
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data, null, 2));

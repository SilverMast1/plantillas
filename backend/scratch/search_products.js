const fs = require('fs');

const products = JSON.parse(fs.readFileSync('scratch/db_products_all.json', 'utf8'));

const keywords = ['hamburguesa', 'cheeseburger', 'panini', 'quesadilla', 'huevo', 'mollete', 'arroz', 'boneless', 'hotdog', 'hot dog', 'fideo', 'atun', 'ceviche', 'chilaquiles', 'omelette'];

keywords.forEach(kw => {
  console.log(`\n--- Matches for keyword: ${kw} ---`);
  const matches = products.filter(p => p.nombre.toLowerCase().includes(kw));
  matches.forEach(p => {
    console.log(`  ID: ${p.id}, Name: ${p.nombre}, Price: ${p.precio_venta}, Category: ${p.categoria}, Active: ${p.activo}`);
  });
});

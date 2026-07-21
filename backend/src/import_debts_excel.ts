import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const filePath = 'c:\\Users\\SERGIO\\Desktop\\adeudossocios.xlsm';

const PRODUCT_MAPPING_RULES = [
  { keyword: 'cigarros caja', searchName: 'Cigarros caja' },
  { keyword: 'caja de cigarros', searchName: 'Cigarros caja' },
  { keyword: 'cigarro suelto', searchName: 'Cigarro suelto' },
  { keyword: 'cigarro sueltos', searchName: 'Cigarro suelto' },
  { keyword: 'cigarros sueltos', searchName: 'Cigarro suelto' },
  { keyword: 'cigarros', searchName: 'Cigarro suelto' },
  { keyword: 'cigarro', searchName: 'Cigarro suelto' },
  { keyword: 'caja de cig', searchName: 'Cigarros caja' },
  
  { keyword: 'agua mineral prep', searchName: 'Agua Mineral Prep' },
  { keyword: 'mineral prep', searchName: 'Agua Mineral Prep' },
  { keyword: 'agua mineral gr', searchName: 'Agua Mineral' },
  { keyword: 'agua mineral ch', searchName: 'Agua Mineral' },
  { keyword: 'agua mineral', searchName: 'Agua Mineral' },
  { keyword: 'mineral', searchName: 'Agua Mineral' },
  { keyword: 'agua natural lt', searchName: 'Agua natural Lt' },
  { keyword: 'agua gr', searchName: 'Agua natural Lt' },
  { keyword: 'agua l', searchName: 'Agua natural Lt' },
  { keyword: 'agua natural 500 ml', searchName: 'Agua Natural 500 ml' },
  { keyword: 'agua ch', searchName: 'Agua Natural 500 ml' },
  { keyword: 'agua m', searchName: 'Agua Natural 500 ml' },
  { keyword: 'agua', searchName: 'Agua Natural 500 ml' },
  
  { keyword: 'amstel ultra', searchName: 'Amstel Ultra' },
  { keyword: 'amstel', searchName: 'Amstel Ultra' },
  { keyword: 'amtel', searchName: 'Amstel Ultra' },
  { keyword: 'ams', searchName: 'Amstel Ultra' },
  
  { keyword: 'carta blanca', searchName: 'Carta Blanca' },
  { keyword: 'cartas', searchName: 'Carta Blanca' },
  { keyword: 'carta', searchName: 'Carta Blanca' },
  
  { keyword: 'tecate light', searchName: 'Tecate Light' },
  { keyword: 'tecate', searchName: 'Tecate Light' },
  { keyword: 'tkt', searchName: 'Tecate Light' },
  
  { keyword: 'indio', searchName: 'Indio' },
  { keyword: 'miller', searchName: 'Miller High Life' },
  { keyword: 'xx lager', searchName: 'XX Lager' },
  { keyword: 'xx ambar', searchName: 'XX Lager' },
  { keyword: 'xx', searchName: 'XX Lager' },
  
  { keyword: 'coca vidrio', searchName: 'Coca Vidrio' },
  { keyword: 'cocas', searchName: 'Coca Vidrio' },
  { keyword: 'coca', searchName: 'Coca Vidrio' },
  
  { keyword: 'fuze tea', searchName: 'Fuze tea' },
  { keyword: 'fuztea', searchName: 'Fuze tea' },
  { keyword: 'fuze', searchName: 'Fuze tea' },
  { keyword: 'fuz tea', searchName: 'Fuze tea' },
  
  { keyword: 'gatorade', searchName: 'Gatorade' },
  { keyword: 'gatore', searchName: 'Gatorade' },
  
  { keyword: 'powerade', searchName: 'Powerade' },
  { keyword: 'ppower', searchName: 'Powerade' },
  { keyword: 'power', searchName: 'Powerade' },
  
  { keyword: 'prep clamato', searchName: 'Prep. Clamato' },
  { keyword: 'clamato prep', searchName: 'Prep. Clamato' },
  { keyword: 'prep clam', searchName: 'Prep. Clamato' },
  { keyword: 'clamato', searchName: 'Prep. Clamato' },
  
  { keyword: 'prep chelada', searchName: 'Prep Chelada' },
  { keyword: 'chelada prep', searchName: 'Prep Chelada' },
  { keyword: 'chelada', searchName: 'Prep Chelada' },
  { keyword: 'chelado', searchName: 'Prep Chelada' },
  
  { keyword: 'prep michelada', searchName: 'Prep. Michelada' },
  { keyword: 'michelada', searchName: 'Prep. Michelada' },
  
  { keyword: 'sabritas', searchName: 'Sabritas' },
  { keyword: 'papitas', searchName: 'Sabritas' },
  { keyword: 'papas', searchName: 'Sabritas' },
  { keyword: 'papita', searchName: 'Sabritas' },
  { keyword: 'paps', searchName: 'Sabritas' },
  { keyword: 'chicharrones con ajo', searchName: 'Sabritas' },
  { keyword: 'chicharrones', searchName: 'Sabritas' },
  { keyword: 'chicharron', searchName: 'Sabritas' },
  { keyword: 'snack', searchName: 'Sabritas' },
  { keyword: 'japoneses', searchName: 'Sabritas' },
  { keyword: 'cacahuates con ajo', searchName: 'Sabritas' },
  { keyword: 'cacahuates', searchName: 'Sabritas' },
  { keyword: 'cacahuate', searchName: 'Sabritas' },
  { keyword: 'galletas', searchName: 'Sabritas' },
  
  { keyword: 'huevos divorciados', searchName: 'Huevos divorciados' },
  { keyword: 'huevos div', searchName: 'Huevos divorciados' },
  { keyword: 'huevos al gusto', searchName: 'Huevos al gusto' },
  { keyword: 'huevos', searchName: 'Huevos al gusto' },
  { keyword: 'huevo', searchName: 'Huevos al gusto' },
  
  { keyword: 'tacos de fideo c/ chicharron', searchName: 'Tacos de fideo c/ chicharron' },
  { keyword: 'tacos de bistec', searchName: 'Tacos de bistec' },
  { keyword: 'taco de barbacoa', searchName: 'Taco de barbacoa' },
  { keyword: 'taco de chicharron', searchName: 'Taco de chicharron' },
  { keyword: 'taco de choriqueso', searchName: 'Taco de choriqueso' },
  { keyword: 'taco de huevo', searchName: 'Taco de huevo' },
  { keyword: 'taco de papa c/ chorizo', searchName: 'Taco de papa c/ chorizo' },
  { keyword: 'taco de papa', searchName: 'Taco de papa c/ chorizo' },
  { keyword: 'taco de picadillo', searchName: 'Taco de picadillo' },
  { keyword: 'taco picadillo', searchName: 'Taco de picadillo' },
  { keyword: 'tacos', searchName: 'Taco de picadillo' },
  { keyword: 'taco', searchName: 'Taco de picadillo' },
  
  { keyword: 'boneless', searchName: 'Boneless' },
  { keyword: 'panini', searchName: 'Panini de pollo al chipotle' },
  { keyword: 'platillo', searchName: 'Platillo' },
  { keyword: 'menudo', searchName: 'Menudo' },
  { keyword: 'chilaquiles', searchName: 'Chilaquiles' },
  { keyword: 'quesadillas', searchName: 'Quesadillas' },
  { keyword: 'quesadilla', searchName: 'Quesadillas' },
  { keyword: 'refresco', searchName: 'Refresco' },
  { keyword: 'gorditas', searchName: 'Gorditas' }
];

function parseDate(val: any): Date {
  if (typeof val === 'number') {
    if (val > 100000) {
      const str = val.toString();
      if (str.length === 6) {
        const day = parseInt(str.substring(0, 2));
        const month = parseInt(str.substring(2, 4)) - 1;
        const year = 2000 + parseInt(str.substring(4, 6));
        return new Date(year, month, day);
      }
    }
    return new Date((val - 25569) * 86400 * 1000);
  }
  
  if (typeof val === 'string') {
    const str = val.toLowerCase().trim();
    if (!str || str === 'undefined') return new Date();
    
    if (/^\d{6}$/.test(str)) {
      const day = parseInt(str.substring(0, 2));
      const month = parseInt(str.substring(2, 4)) - 1;
      const year = 2000 + parseInt(str.substring(4, 6));
      return new Date(year, month, day);
    }

    const cleanStr = str.split('/')[0].split('-')[0].trim();
    const months: { [key: string]: number } = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
      'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
      'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    
    const match = cleanStr.match(/(\d+)\s+de\s+(\w+)/);
    if (match) {
      const day = parseInt(match[1]);
      const monthStr = match[2];
      const month = months[monthStr] !== undefined ? months[monthStr] : 5;
      return new Date(2026, month, day);
    }
  }
  
  return new Date();
}

async function main() {
  console.log('--- INICIANDO IMPORTACIÓN DETALLADA DE ADEUDOS DESDE EXCEL ---');
  
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Limpiar importaciones previas
  const cuentasImportadas = await prisma.cuenta.findMany({
    where: {
      nombre_referencia: 'CARGO INICIAL IMPORTADO'
    }
  });
  const cuentasIds = cuentasImportadas.map(c => c.id);
  
  console.log(`Borrando ${cuentasIds.length} divisiones de cuentas anteriores...`);
  await prisma.divisionCuenta.deleteMany({
    where: {
      cuenta_id: { in: cuentasIds }
    }
  });

  console.log(`Borrando ${cuentasIds.length} detalles de cuentas anteriores...`);
  await prisma.detalleCuenta.deleteMany({
    where: {
      cuenta_id: { in: cuentasIds }
    }
  });
  
  console.log('Borrando cuentas anteriores...');
  await prisma.cuenta.deleteMany({
    where: {
      id: { in: cuentasIds }
    }
  });
  
  const admin = await prisma.usuario.findFirst({
    where: {
      roles: {
        some: {
          role: {
            nombre: 'ADMIN'
          }
        }
      }
    }
  });
  
  if (!admin) {
    console.error('Error: Se necesita un administrador en la BD.');
    return;
  }
  
  const areas = await prisma.area.findMany();
  const defaultArea = areas[0]?.id || 1;
  
  // Obtener productos de la base de datos
  const dbProducts = await prisma.producto.findMany({ where: { activo: true } });
  
  // Buscar o crear producto "Consumo General"
  let productConsumo = dbProducts.find(p => p.nombre.toLowerCase().trim() === 'consumo general');
  if (!productConsumo) {
    productConsumo = await prisma.producto.create({
      data: {
        nombre: 'Consumo General',
        precio_venta: new Decimal(0),
        categoria: 'bebidas',
        activo: true
      }
    });
    console.log('Creado producto "Consumo General" en base de datos.');
  }

  // Mapear reglas de productos a productos reales de BD
  const productMapping = PRODUCT_MAPPING_RULES.map(rule => {
    const prod = dbProducts.find(p => p.nombre.toLowerCase().trim() === rule.searchName.toLowerCase().trim());
    return {
      keyword: rule.keyword,
      product: prod || null
    };
  }).filter(m => m.product !== null) as { keyword: string, product: any }[];

  productMapping.sort((a, b) => b.keyword.length - a.keyword.length);

  let totalImportados = 0;

  // Recorrer las filas a partir de la fila 1 (la fila 0 son cabeceras)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    
    let name = row[0].toString().trim();
    if (name.toLowerCase() === 'gil navarro') {
      name = 'gilberto navarro';
    }
    if (name === 'nombre' || name === '') continue;
    
    let socio = await prisma.cliente.findFirst({
      where: {
        nombre: {
          equals: name
        }
      }
    });

    if (!socio) {
      // Intentar una búsqueda insensible para evitar duplicar por acentos/casing
      const todosClientes = await prisma.cliente.findMany();
      socio = todosClientes.find(c => c.nombre.toLowerCase().trim() === name.toLowerCase().trim()) || null;
    }
    
    if (!socio) {
      const codigoSocio = `SOCIO-${name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(100 + Math.random() * 900)}`;
      socio = await prisma.cliente.create({
        data: {
          nombre: name,
          codigo_socio: codigoSocio,
          activo: true
        }
      });
      console.log(`Socio creado: "${name}" (${codigoSocio})`);
    }
    
    const sets = [
      { date: row[2], desc: row[3], amount: row[4] },
      { date: row[5], desc: row[6], amount: row[7] },
      { date: row[8], desc: row[9], amount: row[10] },
      { date: row[11], desc: row[12], amount: row[13] }
    ];
    
    for (const set of sets) {
      if (set.amount !== undefined && set.amount !== null && set.amount !== '') {
        const amountNum = parseFloat(set.amount.toString());
        if (isNaN(amountNum) || amountNum <= 0) continue;
        
        const totalDec = new Decimal(amountNum);
        const fechaCargo = parseDate(set.date);
        const conceptoOriginal = set.desc ? set.desc.toString().trim() : 'Consumo';
        
        // 1. Crear la cuenta (el ID se genera automáticamente)
        const cuenta = await prisma.cuenta.create({
          data: {
            area_id: defaultArea,
            usuario_id: admin.id,
            nombre_referencia: 'CARGO INICIAL IMPORTADO',
            estado: 'PAGADA',
            subtotal: totalDec,
            total: totalDec,
            metodo_pago: 'CARGO_SOCIO',
            created_at: fechaCargo,
            closed_at: fechaCargo
          }
        });
        
        // 2. Parsear el concepto para desglosar productos
        let textToParse = conceptoOriginal.toLowerCase()
          .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
          .replace(/[.,\-\/()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const matchedItems: { product: any, quantity: number }[] = [];
        
        for (const item of productMapping) {
          const regex = new RegExp(`(?:(\\d+)\\s*[-.]*\\s*)?\\b${item.keyword}\\b`, 'gi');
          let match;
          while ((match = regex.exec(textToParse)) !== null) {
            const qty = match[1] ? parseInt(match[1]) : 1;
            matchedItems.push({
              product: item.product,
              quantity: qty
            });
            // Reemplazar la coincidencia con espacios para evitar doble coincidencia
            textToParse = textToParse.substring(0, match.index) + 
                          ' '.repeat(match[0].length) + 
                          textToParse.substring(match.index + match[0].length);
          }
        }
        
        // 3. Crear detalles en detalle_cuentas y calcular sumatoria
        let totalMatched = new Decimal(0);
        
        for (const matched of matchedItems) {
          const matchedPrice = new Decimal(matched.product.precio_venta);
          const subtotal = matchedPrice.mul(matched.quantity);
          totalMatched = totalMatched.add(subtotal);
          
          await prisma.detalleCuenta.create({
            data: {
              cuenta_id: cuenta.id,
              producto_id: matched.product.id,
              cantidad: new Decimal(matched.quantity),
              precio_unitario: matchedPrice,
              subtotal: subtotal,
              total: subtotal,
              estado_item: 'SERVIDO',
              created_at: fechaCargo
            }
          });
          
          console.log(`    + Detalle: ${matched.quantity} x "${matched.product.nombre}" ($${matched.product.precio_venta} c/u)`);
        }
        
        // 4. Si hay diferencia con el adeudo del Excel, registrar un Ajuste / Consumo General
        const difference = totalDec.sub(totalMatched);
        if (difference.abs().gt(0.01)) {
          // El remanente se guarda en el producto 'Consumo General'
          await prisma.detalleCuenta.create({
            data: {
              cuenta_id: cuenta.id,
              producto_id: productConsumo!.id,
              cantidad: new Decimal(1),
              precio_unitario: difference,
              subtotal: difference,
              total: difference,
              estado_item: 'SERVIDO',
              created_at: fechaCargo
            }
          });
          
          console.log(`    + Ajuste: 1 x "Consumo General" ($${difference.toFixed(2)})`);
        }
        
        // 5. Crear la división de la deuda asociada como PENDIENTE
        await prisma.divisionCuenta.create({
          data: {
            cuenta_id: cuenta.id,
            cliente_id: socio.id,
            porcentaje_participacion: new Decimal(100),
            monto_proporcional: totalDec,
            metodo_pago: 'CARGO_SOCIO',
            estado_pago: 'PENDIENTE',
            pagado_at: null
          }
        });
        
        console.log(`  -> Socio: "${name}" | Total Importe: $${amountNum} (${conceptoOriginal}) | Fecha: ${fechaCargo.toLocaleDateString('es-MX')}`);
        totalImportados++;
      }
    }
  }
  
  console.log(`\n--- IMPORTACIÓN DETALLADA FINALIZADA CON ÉXITO ---`);
  console.log(`Se importaron ${totalImportados} cargos detallados con sus respectivos productos.`);
}

main()
  .catch((e) => {
    console.error('Error durante la importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

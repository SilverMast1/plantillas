import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function cleanValue(val: string): string {
  if (val === '\\N') return 'NULL';
  if (val === 't') return '1';
  if (val === 'f') return '0';
  
  // Desescapar caracteres comunes del formato COPY de PostgreSQL
  let cleaned = val
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');
    
  // Detectar formato de fecha PostgreSQL (ej: 2026-06-19 05:50:34.882+00)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(cleaned)) {
    try {
      // Normalizar la fecha
      let dateStr = cleaned.replace(' ', 'T');
      if (dateStr.endsWith('+00')) {
        dateStr = dateStr.slice(0, -3) + 'Z';
      } else {
        const match = dateStr.match(/(\+\d{2}|-\d{2})$/);
        if (match) {
          dateStr += ':00';
        }
      }
      const isoStr = new Date(dateStr).toISOString();
      return `'${isoStr}'`;
    } catch (err) {
      // Si falla la conversión, se trata como string normal
    }
  }

  // Escapar comillas simples para evitar inyección SQL
  cleaned = cleaned.replace(/'/g, "''");
  return `'${cleaned}'`;
}

async function main() {
  const backupPath = path.join(__dirname, '../../campestre_backup.sql');
  console.log('Leyendo archivo de respaldo:', backupPath);
  
  if (!fs.existsSync(backupPath)) {
    console.error('No se encontró el archivo campestre_backup.sql');
    process.exit(1);
  }

  // Leer el archivo con codificación UTF-16LE
  const content = fs.readFileSync(backupPath, 'utf16le');
  const lines = content.split(/\r?\n/);
  
  console.log('Desactivando llaves foráneas en SQLite...');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

  const tablesToClear = [
    'usuario_roles', 'rol_permisos', 'inventario_areas', 'receta_ingredientes',
    'movimientos_inventario', 'detalle_cuentas', 'divisiones_cuentas', 'cuentas',
    'asignaciones_cadi_clientes', 'retiros_caja', 'turnos', 'clientes', 'cadis',
    'productos', 'insumos', 'areas', 'roles', 'usuarios', 'permisos',
    'gastos_ingresos_ccl', 'idempotency_keys'
  ];

  console.log('Limpiando tablas de SQLite...');
  for (const table of tablesToClear) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
  }

  let currentTable = '';
  let columns: string[] = [];
  let valuesBatch: string[][] = [];
  let totalRowsInserted = 0;

  for (const line of lines) {
    if (line.startsWith('COPY public.')) {
      const match = line.match(/COPY public\.(\w+) \((.+)\) FROM stdin;/);
      if (match) {
        currentTable = match[1];
        columns = match[2].split(', ').map(c => c.trim());
        valuesBatch = [];
        console.log(`Procesando tabla: ${currentTable}...`);
      }
    } else if (line === '\\.') {
      if (currentTable) {
        if (valuesBatch.length > 0) {
          // Dividir la inserción en bloques pequeños para evitar límites de consulta SQL en SQLite
          const chunkSize = 100;
          for (let i = 0; i < valuesBatch.length; i += chunkSize) {
            const chunk = valuesBatch.slice(i, i + chunkSize);
            const insertQueries = chunk.map(row => {
              const cleanedRow = row.map(cleanValue);
              return `INSERT INTO "${currentTable}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${cleanedRow.join(', ')});`;
            });
            
            // Ejecutar en una transacción de Prisma
            await prisma.$transaction(
              insertQueries.map(q => prisma.$executeRawUnsafe(q))
            );
          }
          console.log(`  Se insertaron ${valuesBatch.length} filas en la tabla "${currentTable}".`);
          totalRowsInserted += valuesBatch.length;
        }
        currentTable = '';
      }
    } else if (currentTable) {
      valuesBatch.push(line.split('\t'));
    }
  }

  console.log('Activando llaves foráneas en SQLite...');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');

  console.log(`\n¡Restauración completada con éxito! Se importaron ${totalRowsInserted} filas.`);
}

main()
  .catch((e) => {
    console.error('Error durante la restauración del respaldo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

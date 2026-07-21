const fs = require('fs');
const path = require('path');

// Configuration
const DB_FILE = path.join(__dirname, '../backend/prisma/dev.db');
const BACKUPS_DIR = 'C:\\Users\\SERGIO\\Desktop\\copias de seguridad';

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${dateStr}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

async function runRestore() {
  console.log('--- Iniciando Restauración de Base de Datos ---');
  console.log(`Fecha/Hora local: ${new Date().toLocaleString()}`);

  if (!fs.existsSync(BACKUPS_DIR)) {
    console.error(`Error: No se encontró el directorio de copias de seguridad en: ${BACKUPS_DIR}`);
    process.exit(1);
  }

  // Read all backups
  const files = fs.readdirSync(BACKUPS_DIR);
  const backupFiles = files
    .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
    .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  if (backupFiles.length === 0) {
    console.log(`No se encontraron copias de seguridad (.db) en: ${BACKUPS_DIR}`);
    process.exit(1);
  }

  // Parse arguments
  const args = process.argv.slice(2);
  const listOnly = args.includes('--list') || args.includes('-l');
  const targetFileArg = args.find(arg => !arg.startsWith('-'));

  if (listOnly) {
    console.log('\nCopias de seguridad disponibles (de más reciente a más antigua):');
    backupFiles.forEach((file, index) => {
      const stats = fs.statSync(path.join(BACKUPS_DIR, file));
      console.log(`${index + 1}. ${file} (${(stats.size / 1024).toFixed(2)} KB) - Modificado: ${stats.mtime.toLocaleString()}`);
    });
    console.log('\nPara restaurar una copia específica, ejecute:');
    console.log('node scripts/restore.js <nombre_archivo>');
    console.log('--- Fin del listado ---');
    return;
  }

  let selectedBackup = '';
  if (targetFileArg) {
    // Check if user specified a file that exists
    if (backupFiles.includes(targetFileArg)) {
      selectedBackup = targetFileArg;
    } else {
      // Check if they passed a partial name or a path
      const baseName = path.basename(targetFileArg);
      if (backupFiles.includes(baseName)) {
        selectedBackup = baseName;
      } else {
        console.error(`Error: El archivo "${targetFileArg}" no existe en el directorio de copias de seguridad.`);
        console.log('Use --list o -l para ver los archivos disponibles.');
        process.exit(1);
      }
    }
  } else {
    // Default to the newest backup
    selectedBackup = backupFiles[0];
    console.log(`No se especificó un archivo. Se seleccionó la copia de seguridad más reciente por defecto: ${selectedBackup}`);
  }

  const backupPath = path.join(BACKUPS_DIR, selectedBackup);
  const backupWalPath = `${backupPath}-wal`;

  console.log(`Restaurando desde: ${selectedBackup}`);

  try {
    // 1. Create a pre-restore backup of the current database (just in case)
    if (fs.existsSync(DB_FILE)) {
      const preRestoreName = `pre-restore_${getTimestamp()}.db`;
      const preRestorePath = path.join(BACKUPS_DIR, preRestoreName);
      console.log(`Creando respaldo de seguridad de la base de datos actual en: ${preRestorePath}`);
      fs.copyFileSync(DB_FILE, preRestorePath);
      
      const currentWal = `${DB_FILE}-wal`;
      if (fs.existsSync(currentWal) && fs.statSync(currentWal).size > 0) {
        fs.copyFileSync(currentWal, `${preRestorePath}-wal`);
      }
    }

    // Ensure backend/prisma directory exists
    const dbDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 2. Perform the copy
    console.log(`Copiando ${selectedBackup} a ${DB_FILE}...`);
    fs.copyFileSync(backupPath, DB_FILE);

    // 3. Handle WAL file
    const destWal = `${DB_FILE}-wal`;
    const destShm = `${DB_FILE}-shm`;

    if (fs.existsSync(backupWalPath)) {
      console.log(`Restaurando archivo WAL asociado: ${selectedBackup}-wal`);
      fs.copyFileSync(backupWalPath, destWal);
    } else {
      // If the backup doesn't have a WAL file, delete any existing WAL/SHM files to prevent corruption/mismatch
      if (fs.existsSync(destWal)) {
        console.log('Eliminando archivo WAL anterior para evitar inconsistencias de SQLite...');
        fs.unlinkSync(destWal);
      }
      if (fs.existsSync(destShm)) {
        console.log('Eliminando archivo SHM anterior para evitar inconsistencias de SQLite...');
        fs.unlinkSync(destShm);
      }
    }

    console.log('\n¡Base de datos restaurada con éxito!');
    console.log(`Archivo restaurado: ${selectedBackup}`);
    console.log(`Ubicación de destino: ${DB_FILE}`);
    console.log('--- Fin del proceso (Éxito) ---');

  } catch (error) {
    console.error('Error durante la restauración de la base de datos:', error);
    process.exit(1);
  }
}

runRestore();

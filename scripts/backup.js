const fs = require('fs');
const path = require('path');

// Configuration
const DB_FILE = path.join(__dirname, '../backend/prisma/dev.db');
const BACKUPS_DIR = 'C:\\Users\\SERGIO\\Desktop\\copias de seguridad';
const KEEP_DAYS = 30;

function getLocalDateString() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${getLocalDateString()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

async function runBackup() {
  console.log('--- Iniciando Copia de Seguridad ---');
  console.log(`Fecha/Hora local: ${new Date().toLocaleString()}`);
  
  if (!fs.existsSync(DB_FILE)) {
    console.error(`Error: No se encontró el archivo de base de datos en: ${DB_FILE}`);
    process.exit(1);
  }

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUPS_DIR)) {
    console.log(`Creando directorio de copias de seguridad: ${BACKUPS_DIR}`);
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const force = process.argv.includes('--force') || process.argv.includes('-f');
  const todayStr = getLocalDateString();
  
  // Check if a backup for today already exists
  if (!force) {
    const existingFiles = fs.readdirSync(BACKUPS_DIR);
    const todayBackupExists = existingFiles.some(file => file.startsWith(`backup_${todayStr}_`) && file.endsWith('.db'));
    if (todayBackupExists) {
      console.log(`Ya existe una copia de seguridad para el día de hoy (${todayStr}).`);
      console.log('Use el parámetro --force o -f para forzar una nueva copia de seguridad.');
      console.log('--- Fin del proceso (Sin cambios) ---');
      return;
    }
  }

  const timestamp = getTimestamp();
  const backupName = `backup_${timestamp}.db`;
  const destPath = path.join(BACKUPS_DIR, backupName);

  try {
    console.log(`Copiando base de datos a: ${destPath}`);
    fs.copyFileSync(DB_FILE, destPath);
    
    // Check files size
    const origSize = fs.statSync(DB_FILE).size;
    const destSize = fs.statSync(destPath).size;
    
    console.log(`¡Copia de seguridad creada con éxito!`);
    console.log(`Archivo: ${backupName}`);
    console.log(`Tamaño original: ${(origSize / 1024).toFixed(2)} KB`);
    console.log(`Tamaño copia: ${(destSize / 1024).toFixed(2)} KB`);
    
    // Also copy WAL file if it has content, for completeness
    const walFile = `${DB_FILE}-wal`;
    if (fs.existsSync(walFile) && fs.statSync(walFile).size > 0) {
      const destWalPath = `${destPath}-wal`;
      fs.copyFileSync(walFile, destWalPath);
      console.log(`Copiado archivo de transacciones WAL: ${backupName}-wal`);
    }

    // Cleanup old backups
    cleanOldBackups();

  } catch (error) {
    console.error('Error al realizar la copia de seguridad:', error);
    process.exit(1);
  }
}

function cleanOldBackups() {
  console.log(`\n--- Limpieza de copias de seguridad antiguas (más de ${KEEP_DAYS} días) ---`);
  try {
    const files = fs.readdirSync(BACKUPS_DIR);
    const now = new Date();
    const cutoffTime = now.getTime() - (KEEP_DAYS * 24 * 60 * 60 * 1000);
    
    let deletedCount = 0;
    
    files.forEach(file => {
      // We only target files starting with "backup_" and ending with ".db" or ".db-wal"
      if (file.startsWith('backup_') && (file.endsWith('.db') || file.endsWith('.db-wal'))) {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          console.log(`Eliminando copia antigua: ${file}`);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    });
    
    if (deletedCount === 0) {
      console.log('No se encontraron copias de seguridad antiguas para eliminar.');
    } else {
      console.log(`Se eliminaron ${deletedCount} archivo(s) antiguo(s).`);
    }
  } catch (error) {
    console.error('Error durante la limpieza de copias antiguas:', error);
  }
}

runBackup();

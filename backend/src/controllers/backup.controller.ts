import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const prisma = new PrismaClient();

// Rutas de archivos
const DB_DIR = path.resolve(__dirname, '../../prisma');
const DB_FILE = path.join(DB_DIR, 'dev.db');
const BACKUPS_DIR = 'C:\\Users\\SERGIO\\Desktop\\copias de seguridad';

// Asegurar que exista la carpeta de respaldos
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// ==========================================
// RESPALDO AUTOMÁTICO CADA 8 HORAS
// ==========================================
function realizarBackupAutomatico() {
  try {
    if (!fs.existsSync(DB_FILE)) return;

    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}_${pad(ahora.getHours())}-${pad(ahora.getMinutes())}-${pad(ahora.getSeconds())}`;
    const backupName = `backup_${timestamp}.db`;
    const destPath = path.join(BACKUPS_DIR, backupName);

    // Hacer checkpoint WAL antes de copiar
    try {
      const db = new Database(DB_FILE, { readonly: true });
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
    } catch (e) {
      console.warn('[AutoBackup] No se pudo hacer checkpoint WAL:', e);
    }

    fs.copyFileSync(DB_FILE, destPath);
    fs.utimesSync(destPath, ahora, ahora);

    console.log(`[AutoBackup] Respaldo automático creado: ${backupName}`);
  } catch (error) {
    console.error('[AutoBackup] Error al crear respaldo automático:', error);
  }
}

// Iniciar ciclo automático cada 8 horas
const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;
setInterval(realizarBackupAutomatico, OCHO_HORAS_MS);
console.log('[AutoBackup] Respaldo automático cada 8 horas activado ✓');

/**
 * Listar todos los respaldos disponibles
 */
export async function listarBackups(req: Request, res: Response) {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(BACKUPS_DIR);
    const backups = files
      .filter((file) => file.startsWith('backup_') && file.endsWith('.db'))
      .map((file) => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          nombre: file,
          fecha: stats.mtime,
          tamano: stats.size,
        };
      })
      .sort((a, b) => b.nombre.localeCompare(a.nombre));

    return res.json(backups);
  } catch (error) {
    console.error('Error al listar respaldos:', error);
    return res.status(500).json({ error: 'Error al listar los respaldos de la base de datos' });
  }
}

/**
 * Crear un respaldo de la base de datos actual
 */
export async function crearBackup(req: Request, res: Response) {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return res.status(404).json({ error: 'Archivo de base de datos original no encontrado' });
    }

    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}_${pad(ahora.getHours())}-${pad(ahora.getMinutes())}-${pad(ahora.getSeconds())}`;
    const backupName = `backup_${timestamp}.db`;
    const destPath = path.join(BACKUPS_DIR, backupName);

    // Checkpoint WAL antes de copiar para garantizar datos completos
    try {
      const db = new Database(DB_FILE, { readonly: true });
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
    } catch (e) {
      console.warn('No se pudo hacer checkpoint WAL antes de backup:', e);
    }

    fs.copyFileSync(DB_FILE, destPath);

    try {
      fs.utimesSync(destPath, ahora, ahora);
    } catch (e) {
      console.warn('No se pudo actualizar la fecha del archivo de respaldo:', e);
    }

    return res.json({
      message: 'Respaldo creado con éxito',
      respaldo: {
        nombre: backupName,
        fecha: ahora,
        tamano: fs.statSync(destPath).size,
      },
    });
  } catch (error) {
    console.error('Error al crear respaldo:', error);
    return res.status(500).json({ error: 'Error al crear el respaldo de la base de datos' });
  }
}

/**
 * Restaurar un respaldo seleccionado.
 * Usa better-sqlite3 para checkpoint WAL y liberar bloqueos (evita EBUSY).
 */
export async function restaurarBackup(req: Request, res: Response) {
  const { nombreArchivo } = req.body;

  if (!nombreArchivo) {
    return res.status(400).json({ error: 'El nombre del archivo de respaldo es requerido' });
  }

  const backupPath = path.join(BACKUPS_DIR, nombreArchivo);

  try {
    if (!fs.existsSync(backupPath) || !nombreArchivo.startsWith('backup_') || !nombreArchivo.endsWith('.db')) {
      return res.status(404).json({ error: 'Archivo de respaldo no encontrado o inválido' });
    }

    console.log(`Iniciando restauración de respaldo: ${nombreArchivo}`);

    // Desconectar Prisma para liberar sus conexiones internas
    await prisma.$disconnect();

    // Checkpoint WAL con better-sqlite3: vacía el WAL al archivo principal y cierra limpiamente
    try {
      const db = new Database(DB_FILE);
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
      console.log('Checkpoint WAL completado — archivos WAL/SHM liberados.');
    } catch (e) {
      console.warn('No se pudo hacer checkpoint WAL, intentando continuar:', e);
    }

    // Breve pausa para garantizar que los file handles del SO se liberen
    await new Promise(resolve => setTimeout(resolve, 500));

    // Eliminar archivos WAL/SHM residuales si aún existen
    const walFile = `${DB_FILE}-wal`;
    const shmFile = `${DB_FILE}-shm`;
    for (const f of [walFile, shmFile]) {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (e) {
          console.warn(`No se pudo borrar ${path.basename(f)}:`, e);
        }
      }
    }

    // Copiar el respaldo sobre la base de datos activa
    fs.copyFileSync(backupPath, DB_FILE);

    // Reconectar Prisma
    await prisma.$connect();

    console.log(`Restauración exitosa de: ${nombreArchivo}`);
    return res.json({ message: 'Base de datos restaurada con éxito' });
  } catch (error) {
    console.error('Error al restaurar respaldo:', error);
    try { await prisma.$connect(); } catch (_) {}
    return res.status(500).json({ error: 'Error durante la restauración de la base de datos' });
  }
}

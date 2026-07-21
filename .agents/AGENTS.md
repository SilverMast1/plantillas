# Reglas de Proyecto - Club Campestre

## Copias de Seguridad Automáticas
- **Regla**: Al iniciar la jornada laboral o el primer contacto del día, el agente debe realizar una copia de seguridad (respaldo) de la base de datos.
- **Acción**: Ejecutar el comando `node scripts/backup.js` (o `npm run db:backup`) en el directorio raíz del proyecto.
- **Detalles**:
  - Las copias de seguridad se almacenan en el escritorio en la ruta: `C:\Users\SERGIO\Desktop\copias de seguridad`.
  - El script evita duplicaciones para el mismo día. Si es necesario forzar la copia, usar la opción `--force` (`node scripts/backup.js --force`).

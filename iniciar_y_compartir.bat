@echo off
title Club Campestre - POS Server
cd /d "%~dp0"

echo ===================================================
echo   INICIANDO CLUB CAMPESTRE (SERVIDOR Y TUNEL PUBLICO)
echo ===================================================
echo.

:: 1. Realizar copia de seguridad automática (según reglas del proyecto)
echo [1/3] Realizando copia de seguridad de la base de datos...
call node scripts/backup.js
echo.

:: 2. Asegurar que Docker esté arriba (Desactivado: Se usa SQLite)
:: echo [2/3] Levantando base de datos en Docker...
:: call npm run db:up
echo [2/3] Usando base de datos SQLite (local)...
echo.

:: 3. Iniciar el servidor local y el túnel público
echo [3/3] Iniciando servidores y creando enlace publico...
echo.
echo ===================================================
echo El sistema estara disponible localmente y publicamente.
echo Copia el enlace "url:" de localtunnel que aparecera abajo.
echo ===================================================
echo.

call npx concurrently "npm run dev" "npx localtunnel --port 3000 --local-host 127.0.0.1 --subdomain campestre-pos-club"

pause

@echo off
:: Navigate to the project directory
cd /d "c:\Users\SERGIO\Desktop\Campestreantigravity"

:: Execute the backup script
node scripts/backup.js >> backup_log.txt 2>&1

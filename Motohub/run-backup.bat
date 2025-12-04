@echo off
REM Firestore Backup Script for Windows Task Scheduler
REM This runs daily at 8 PM

echo ========================================
echo Firestore Backup - %date% %time%
echo ========================================

cd /d "C:\Projects\Capstone\Capstone-Project\Motohub"

REM Run the backup script
node backup-script.cjs

REM Log completion
echo Backup completed at %date% %time% >> backup-log.txt

echo ========================================
echo Backup Complete!
echo ========================================

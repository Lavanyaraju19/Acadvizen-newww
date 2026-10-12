@echo off
cd /d "c:\Users\HP\Downloads\Acadvizen-newww-main\Acadvizen-newww-main"
if "%SUPABASE_DB_PASSWORD%"=="" (echo Set SUPABASE_DB_PASSWORD in this window first; it is never stored in the repository. & exit /b 1)
node scripts/db-inspect.js
pause

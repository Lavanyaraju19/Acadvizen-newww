@echo off
if "%SUPABASE_DB_PASSWORD%"=="" (echo Set SUPABASE_DB_PASSWORD in this window first; it is never stored in the repository. & exit /b 1)
SET PGPASSWORD=%SUPABASE_DB_PASSWORD%
cd /d "c:\Users\HP\Downloads\Acadvizen-newww-main\Acadvizen-newww-main"
node scripts/apply-migration-v2.cjs
pause

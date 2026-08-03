@echo off
cd /d "c:\Users\HP\Downloads\Acadvizen-newww-main\Acadvizen-newww-main"
echo Applying CMS production fixes to staging database...
node -e "const{Client}=require('pg');const c=new Client({host:'hhfccftkfryesjirauwf.supabase.co',port:5432,user:'postgres',password:'Acadvizen!2026Staging',database:'postgres',ssl:{rejectUnauthorized:false}});(async()=>{await c.connect();console.log('CONNECTED');const r=await c.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\\'public\\' AND table_type=\\'BASE TABLE\\' ORDER BY table_name');r.rows.forEach(t=>console.log('TABLE:'+t.table_name));await c.end()})()" 2>&1
pause

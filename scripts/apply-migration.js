/**
 * Apply Phase 1 Hybrid CMS migration to Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://hhfccftkfryesjirauwf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZmNjZnRrZnJ5ZXNqaXJhdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0NTYwMiwiZXhwIjoyMDg1NTIxNjAyfQ.FQtYdnz-hdF68TDFZ9FnVvUFZiAZr7nHrjZO0Ij7ytE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying Phase 1 Hybrid CMS migration...\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/20260128_phase1_hybrid_cms_base.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf8')
  console.log(`📄 Migration file: ${migrationPath}`)
  console.log(`📊 SQL size: ${sql.length} characters\n`)

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    console.log(`Executing statement ${i + 1}/${statements.length}...`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`)
        errorCount++
      } else {
        console.log(`  ✅ Success`)
        successCount++
      }
    } catch (err) {
      console.error(`  ❌ Exception: ${err.message}`)
      errorCount++
    }
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log('📊 MIGRATION SUMMARY')
  console.log('═══════════════════════════════════════════════════')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📊 Total: ${statements.length}`)
  console.log('═══════════════════════════════════════════════════')

  if (errorCount === 0) {
    console.log('\n✅ Migration completed successfully!\n')
  } else {
    console.log('\n⚠️  Migration completed with errors. Please review.\n')
    process.exit(1)
  }
}

applyMigration()
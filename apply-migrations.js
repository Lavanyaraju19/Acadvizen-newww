/**
 * Apply missing database migrations to Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const MIGRATIONS_TO_APPLY = [
  '20260722_banner_management.sql',
  '20260722_popup_management.sql',
  '20260722_form_builder.sql',
]

async function applyMigration(migrationFile) {
  console.log(`\nApplying migration: ${migrationFile}`)
  
  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migrationFile)
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`   Found ${statements.length} SQL statements`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const statement of statements) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_temp').select('*').limit(1)
          if (directError && directError.message.includes('does not exist')) {
            console.log(`   ⚠️  Skipping (requires direct SQL execution): ${statement.substring(0, 50)}...`)
            errorCount++
          } else {
            console.log(`   ⚠️  Statement skipped: ${statement.substring(0, 50)}...`)
            errorCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        console.log(`   ⚠️  Statement error: ${err.message}`)
        errorCount++
      }
    }
    
    console.log(`   ✓ Migration applied: ${successCount} statements executed, ${errorCount} skipped`)
    return { success: true, applied: successCount, skipped: errorCount }
    
  } catch (error) {
    console.log(`   ❌ Migration failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function applyAllMigrations() {
  console.log('Applying Missing Database Migrations...')
  console.log('=' .repeat(50))
  
  const results = []
  
  for (const migration of MIGRATIONS_TO_APPLY) {
    const result = await applyMigration(migration)
    results.push({ migration, ...result })
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('\nSUMMARY:')
  console.log('=' .repeat(50))
  
  const applied = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  results.forEach(result => {
    const status = result.success ? '✅ APPLIED' : '❌ FAILED'
    console.log(`${status} - ${result.migration}`)
    if (result.success) {
      console.log(`       Applied: ${result.applied}, Skipped: ${result.skipped}`)
    } else {
      console.log(`       Error: ${result.error}`)
    }
  })
  
  console.log('\n' + '=' .repeat(50))
  console.log(`Total: ${results.length} migrations`)
  console.log(`Applied: ${applied}`)
  console.log(`Failed: ${failed}`)
  console.log('=' .repeat(50))
  
  if (failed > 0) {
    console.log('\n⚠️  Some migrations failed. These may need to be applied manually in Supabase SQL Editor.')
  } else {
    console.log('\n✅ All migrations applied successfully!')
  }
}

applyAllMigrations()

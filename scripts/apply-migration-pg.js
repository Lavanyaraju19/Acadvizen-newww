/**
 * Apply Phase 1 Hybrid CMS migration using PostgreSQL client
 * This connects directly to the database to execute SQL
 */

const { Client } = require('pg')

// Supabase PostgreSQL connection string
const connectionString = 'postgresql://postgres.hhfccftkfryesjirauwf:Acadvizen@2024@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

async function applyMigration() {
  console.log('🚀 Applying Phase 1 Hybrid CMS migration...\n')

  try {
    await client.connect()
    console.log('✅ Connected to PostgreSQL database\n')

    const fs = require('fs')
    const path = require('path')
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260128_phase1_hybrid_cms_base.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath)
      process.exit(1)
    }

    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(`📄 Migration file: ${migrationPath}`)
    console.log(`📊 SQL size: ${sql.length} characters\n`)

    console.log('Executing migration SQL...')
    await client.query(sql)
    console.log('✅ Migration completed successfully!\n')

    await client.end()
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('\n📄 SQL file location: supabase/migrations/20260128_phase1_hybrid_cms_base.sql')
    console.log('💡 Please apply the migration manually via Supabase SQL Editor\n')
    await client.end()
    process.exit(1)
  }
}

applyMigration()
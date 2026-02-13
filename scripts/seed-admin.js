// scripts/seed-admin.js
// Create or update an admin user in Supabase using the Admin API.
// IMPORTANT: Use the service_role key, never the anon key.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_EMAIL = 'operation@acadvizen.com'
const ADMIN_PASSWORD = 'Admin@Acadvizen2026'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  try {
    // 1) Check if user exists
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (listError) throw listError

    const existing = listData.users.find((u) => u.email === ADMIN_EMAIL)

    if (!existing) {
      // 2) Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin' },
      })
      if (error) throw error
      console.log('Admin user created:', data.user?.id, data.user?.email)
      return
    }

    // 3) Update existing user (reset password + update metadata)
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password: ADMIN_PASSWORD,
        user_metadata: { role: 'admin' },
        email_confirm: true,
      },
    )
    if (updateError) throw updateError
    console.log('Admin user updated:', updateData.user?.id, updateData.user?.email)
  } catch (err) {
    console.error('Failed to create/update admin user:', err?.message || err)
    process.exit(1)
  }
}

main()

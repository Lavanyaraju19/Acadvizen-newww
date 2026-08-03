// Create admin user in the remote Supabase project
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hhfccftkfryesjirauwf.supabase.co';
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Create all needed admin users
  const users = [
    { email: 'operation@acadvizen.com', password: process.env.ADMIN_PASSWORD, role: 'super_admin' },
    { email: 'admin@acadvizen.com', password: process.env.ADMIN_PASSWORD, role: 'super_admin' },
    { email: 'admin@acadvizen.com', password: process.env.ADMIN_PASSWORD, role: 'super_admin' },
  ];

  for (const user of users) {
    try {
      // Check if user exists
      const { data: existing } = await supabase.auth.admin.getUserByEmail(user.email).catch(() => null);
      if (existing?.user) {
        console.log(`User ${user.email} already exists, updating profile...`);
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: existing.user.id, 
            email: user.email, 
            role: user.role,
            full_name: 'Admin User',
            approval_status: 'approved'
          }, { onConflict: 'id' });
        if (profileError) {
          console.log(`  Profile error: ${profileError.message}`);
          // Try insert
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ 
              id: existing.user.id, 
              email: user.email, 
              role: user.role,
              full_name: 'Admin User',
              approval_status: 'approved'
            });
          if (insertError) console.log(`  Insert error: ${insertError.message}`);
          else console.log(`  Profile inserted successfully`);
        } else {
          console.log(`  Profile updated successfully`);
        }
      } else {
        console.log(`Creating user ${user.email}...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { role: user.role }
        });
        if (createError) {
          console.log(`  Create error: ${createError.message}`);
          continue;
        }
        console.log(`  Created user: ${newUser.user.id}`);
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: newUser.user.id, 
            email: user.email, 
            role: user.role,
            full_name: 'Admin User',
            approval_status: 'approved'
          });
        if (profileError) console.log(`  Profile insert error: ${profileError.message}`);
        else console.log(`  Profile created successfully`);
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
  
  console.log('\nDone.');
}

main().catch(e => console.error('FATAL:', e));

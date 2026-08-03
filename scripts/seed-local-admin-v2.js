/* Seed admin user - use signup instead of admin API for local Supabase. */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

async function main() {
  const email = 'admin@acadvizen.com';
  const password = process.env.ADMIN_PASSWORD;

  // Use anon key for signup
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
    email,
    password,
    options: { data: { role: 'admin' } }
  });

  if (signUpError) {
    console.error('Signup error:', signUpError.message);
    console.log('Trying to use existing user directly...');
  } else {
    console.log('Signup success:', signUpData?.user?.id);
  }

  // Now use service key to find/create profile
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Try to find user by email query
  const { data: foundUsers } = await serviceClient.auth.admin.listUsers();
  let userId = null;
  if (foundUsers?.users) {
    const match = foundUsers.users.find(u => u.email === email);
    if (match) {
      userId = match.id;
      console.log('Found user via admin API:', userId);
    }
  }

  if (!userId) {
    // Try getting from profiles table directly
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existingProfile) {
      userId = existingProfile.id;
      console.log('Found user from profiles:', userId);
    }
  }

  if (!userId) {
    console.log('Could not find user. Creating profile record with a UUID...');
    // Generate a UUID for the user
    const { randomUUID } = require('node:crypto');
    userId = randomUUID();
    console.log('Using generated UUID:', userId);
  }

  // Create/update profile
  const { data: profile, error: profError } = await serviceClient
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      role: 'super_admin',
      full_name: 'Admin User',
      is_active: true,
    }, { onConflict: 'id' })
    .select('*')
    .single();

  if (profError) {
    console.error('Profile error:', profError.message);
  } else {
    console.log('Profile created/updated:', profile?.id);
  }

  // Assign admin role
  const { data: roles } = await serviceClient
    .from('roles')
    .select('id,slug')
    .eq('slug', 'super_admin');
  
  if (roles && roles.length > 0) {
    const { error: urError } = await serviceClient
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: roles[0].id,
      }, { onConflict: 'user_id,role_id' });
    if (urError) {
      console.error('User role error:', urError.message);
    } else {
      console.log('Admin role assigned.');
    }
  }

  console.log('\nDone. Admin login:', email, '/', password);
  console.log('User ID:', userId);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

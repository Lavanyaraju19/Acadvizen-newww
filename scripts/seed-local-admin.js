/* Seed admin user into local Supabase auth and profiles. */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = 'admin@acadvizen.com';
  const password = process.env.ADMIN_PASSWORD;

  // Try to create user via admin API
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes('already exists')) {
      console.log('Admin user already exists.');
    } else {
      console.error('Failed to create admin user:', createError.message);
      // Try a different approach - sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: 'admin' } }
      });
      if (signUpError) {
        console.error('Signup also failed:', signUpError.message);
      } else {
        console.log('Signed up admin user:', signUpData?.user?.id);
      }
    }
  } else {
    console.log('Created admin user:', user?.user?.id);
  }

  // Get user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users?.find(u => u.email === email);
  if (!adminUser) {
    console.error('Admin user not found after creation.');
    return;
  }
  console.log('Admin user ID:', adminUser.id);

  // Create/update profile
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .upsert({
      id: adminUser.id,
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
    console.log('Profile created:', profile?.id);
  }

  // Assign admin role
  const { data: roles } = await supabase.from('roles').select('id,slug').eq('slug', 'super_admin');
  if (roles && roles.length > 0) {
    const { error: urError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: adminUser.id,
        role_id: roles[0].id,
      }, { onConflict: 'user_id,role_id' });
    if (urError) {
      console.error('User role error:', urError.message);
    } else {
      console.log('Admin role assigned.');
    }
  }

  console.log('Done. Admin login:', email, '/', password);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

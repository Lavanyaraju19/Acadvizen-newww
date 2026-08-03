// Create admin users in the remote Supabase project using REST API
const SUPABASE_URL = 'https://hhfccftkfryesjirauwf.supabase.co';
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

async function main() {
  const users = [
    { email: 'operation@acadvizen.com', password: process.env.ADMIN_PASSWORD },
    { email: 'admin@acadvizen.com', password: process.env.ADMIN_PASSWORD },
  ];

  for (const user of users) {
    try {
      console.log(`Creating user ${user.email}...`);
      
      // Create user via GoTrue admin API
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { role: 'super_admin' }
        })
      });
      
      const createData = await createRes.json();
      if (!createRes.ok) {
        if (createData.code === 422 && createData.msg?.includes('already exists')) {
          console.log(`  User already exists, fetching...`);
        } else {
          console.log(`  Create error: ${JSON.stringify(createData)}`);
          continue;
        }
      } else {
        console.log(`  Created user: ${createData.id}`);
      }

      // Get user by email
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(user.email)}`, {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
      });
      const listData = await listRes.json();
      const userId = listData?.users?.[0]?.id || createData?.id;
      
      if (!userId) {
        console.log('  Could not find user ID');
        continue;
      }
      console.log(`  User ID: ${userId}`);

      // Create/update profile via PostgREST
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'GET',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
      });
      const existingProfiles = await profileRes.json();
      
      if (existingProfiles?.length > 0) {
        console.log('  Profile exists, updating...');
        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ 
            role: 'super_admin', 
            full_name: 'Admin User',
            approval_status: 'approved'
          })
        });
        console.log(`  Update status: ${updateRes.status}`);
      } else {
        console.log('  Creating profile...');
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ 
            id: userId,
            email: user.email,
            role: 'super_admin', 
            full_name: 'Admin User',
            approval_status: 'approved'
          })
        });
        console.log(`  Insert status: ${insertRes.status}`);
        const insertData = await insertRes.json();
        console.log(`  Insert result: ${JSON.stringify(insertData).slice(0,200)}`);
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
  
  console.log('\nDone.');
}

main().catch(e => console.error('FATAL:', e));

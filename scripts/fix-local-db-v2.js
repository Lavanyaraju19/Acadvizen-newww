/* Fix local disposable Supabase - try connecting as supabase_admin. */
const { Client } = require('pg');

const USERS = [
  { user: 'postgres', password: 'postgres' },
  { user: 'supabase_admin', password: 'postgres' },
  { user: 'supabase_admin', password: '' },
  { user: 'supabase_admin', password: 'supabase' },
];

const SQL = `
ALTER TABLE public.courses OWNER TO postgres;
ALTER TABLE public.tools_extended OWNER TO postgres;
ALTER TABLE public.registrations OWNER TO postgres;
ALTER TABLE public.enrollments OWNER TO postgres;
ALTER TABLE public.payments OWNER TO postgres;

ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS og_image text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS noindex boolean DEFAULT false;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.pages ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.pages ALTER COLUMN is_published SET DEFAULT false;

ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS excerpt text;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS content_json jsonb;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS auto_generate_blocks boolean DEFAULT false;
ALTER TABLE public.blogs ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.blogs ALTER COLUMN published SET DEFAULT false;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.courses ALTER COLUMN is_active SET DEFAULT false;
ALTER TABLE public.courses ALTER COLUMN is_published SET DEFAULT false;

ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS content_json jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS style_json jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.tools_extended ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.tools_extended ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS from_path text;
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS to_path text;
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS status_code integer DEFAULT 301;
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.city_pages ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.city_pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.city_pages ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.city_pages ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.location_pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.location_pages ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE TABLE IF NOT EXISTS public.drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  draft_data jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text,
  location text DEFAULT 'header',
  menu_location text DEFAULT 'header',
  parent_id uuid,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.roles (name, slug, permissions) VALUES
  ('Super Admin', 'super_admin', '{"*": ["*"]}'),
  ('Admin', 'admin', '{"*": ["*"]}')
ON CONFLICT (slug) DO NOTHING;
`;

async function tryConnect(creds) {
  const client = new Client({
    host: '127.0.0.1', port: 54322,
    user: creds.user, password: creds.password,
    database: 'postgres',
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    console.log(`Connected as ${creds.user}/${creds.password}`);
    return client;
  } catch (e) {
    try { await client.end(); } catch {}
    return null;
  }
}

async function main() {
  let client = null;
  for (const creds of USERS) {
    client = await tryConnect(creds);
    if (client) break;
  }
  if (!client) {
    console.error('Could not connect with any known credentials.');
    process.exit(1);
  }

  const statements = SQL.split(';').filter(s => s.trim().length > 0);
  let applied = 0, errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    try {
      await client.query(stmt + ';');
      applied++;
    } catch (e) {
      const msg = String(e.message || '').toLowerCase();
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        applied++;
      } else {
        console.log(`  Error #${i}: ${e.message.slice(0, 150)}`);
        errors++;
      }
    }
  }

  console.log(`\nStatements: ${applied} applied, ${errors} errors`);

  // Verify
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  const pageCols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='pages' ORDER BY column_name"
  );
  console.log('pages:', pageCols.rows.map(r => r.column_name).join(', '));

  const blogCols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='blogs' ORDER BY column_name"
  );
  console.log('blogs:', blogCols.rows.map(r => r.column_name).join(', '));

  await client.end();
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

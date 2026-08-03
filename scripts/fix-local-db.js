/* Fix local disposable Supabase DB to match what E2E tests expect. */
const { Client } = require('pg');

const DB = {
  host: '127.0.0.1', port: 54322, user: 'postgres',
  password: 'postgres', database: 'postgres',
  connectionTimeoutMillis: 15000,
};

const SQL = `
-- Transfer ownership of tables to supabase_admin
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tableowner='postgres'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO supabase_admin', tbl);
  END LOOP;
END$$;

-- Add missing columns to pages
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

-- Add missing columns to blogs
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

-- Add missing columns to sections
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS content_json jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS style_json jsonb DEFAULT '{}'::jsonb;

-- Add missing columns to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.courses ALTER COLUMN is_active SET DEFAULT false;
ALTER TABLE public.courses ALTER COLUMN is_published SET DEFAULT false;

-- Add missing columns to tools_extended
ALTER TABLE public.tools_extended ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.tools_extended ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add missing columns to redirects
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS from_path text;
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS to_path text;
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS status_code integer DEFAULT 301;
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add missing columns to city_pages
ALTER TABLE public.city_pages ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.city_pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.city_pages ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.city_pages ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add missing columns to location_pages
ALTER TABLE public.location_pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.location_pages ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add missing columns to reusable_sections
ALTER TABLE public.reusable_sections ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.reusable_sections ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.reusable_sections ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add missing columns to page_templates
ALTER TABLE public.page_templates ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.page_templates ADD COLUMN IF NOT EXISTS created_by uuid;

-- Create drafts table if not exists
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

-- Create page_versions table if not exists
CREATE TABLE IF NOT EXISTS public.page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE,
  version_data jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create blog_versions table if not exists
CREATE TABLE IF NOT EXISTS public.blog_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES public.blogs(id) ON DELETE CASCADE,
  version_data jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create blog_tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create authors table
CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create navigation_menus table
CREATE TABLE IF NOT EXISTS public.navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text,
  location text DEFAULT 'header',
  menu_location text DEFAULT 'header',
  parent_id uuid REFERENCES public.navigation_menus(id),
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS set_pages_updated_at ON public.pages;
CREATE TRIGGER set_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_blogs_updated_at ON public.blogs;
CREATE TRIGGER set_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_sections_updated_at ON public.sections;
CREATE TRIGGER set_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant public read access
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Insert default admin role
INSERT INTO public.roles (name, slug, permissions)
VALUES ('Super Admin', 'super_admin', '{"*": ["*"]}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.roles (name, slug, permissions)
VALUES ('Admin', 'admin', '{"*": ["*"]}')
ON CONFLICT (slug) DO NOTHING;
`;

async function main() {
  const client = new Client(DB);
  await client.connect();
  console.log('Connected to local Postgres.\n');

  // Execute in chunks
  const statements = SQL.split(';').filter(s => s.trim().length > 0);

  let applied = 0;
  let errors = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    try {
      await client.query(stmt + ';');
      applied++;
    } catch (e) {
      const msg = String(e.message || '').toLowerCase();
      if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('multiple primary keys')) {
        applied++;
      } else {
        console.log(`  Error at statement ${i}: ${e.message.slice(0, 150)}`);
        errors++;
      }
    }
  }

  console.log(`Statements: ${applied} applied, ${errors} errors\n`);

  // Verify result
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  const pageCols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='pages' ORDER BY column_name"
  );
  console.log('\npages columns:', pageCols.rows.map(r => r.column_name).join(', '));

  const blogCols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='blogs' ORDER BY column_name"
  );
  console.log('blogs columns:', blogCols.rows.map(r => r.column_name).join(', '));

  await client.end();
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

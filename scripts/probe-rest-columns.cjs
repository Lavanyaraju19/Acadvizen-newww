/* Probe staging schema column existence via the Supabase REST API.
 * PostgREST returns HTTP 400 with code 42703 when a selected column is absent.
 * This is a read-only probe — it never mutates data.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES = {
  pages: ['id','title','slug','description','seo_title','seo_description','content','status','created_at','updated_at','is_active','is_published','published_at','scheduled_publish_at','scheduled_unpublish_at','deleted_at','canonical_url','og_image','noindex','exclude_from_sitemap','sections_json','page_template_id','parent_id','order_index','workflow_status','created_by','updated_by','meta_title','meta_description'],
  blogs: ['id','title','slug','description','seo_title','seo_description','content','content_json','status','created_at','updated_at','is_active','is_published','published_at','scheduled_publish_at','scheduled_unpublish_at','deleted_at','canonical_url','og_image','noindex','exclude_from_sitemap','featured_image','image','excerpt','tags','categories','author','author_id','faq_schema','created_by','meta_title','meta_description'],
  city_pages: ['id','city_name','slug','seo_title','seo_description','canonical_url','is_active','deleted_at','published_at','scheduled_publish_at','scheduled_unpublish_at','priority','created_by','updated_by','created_at','updated_at','exclude_from_sitemap','features','stats','testimonials','gallery','faqs','og_image_url','meta_title','meta_description','focus_keyword','json_ld_schema','hero_title','hero_subtitle','hero_description'],
  location_pages: ['id','title','slug','status','content','sections_json','created_at','updated_at','published_at','scheduled_publish_at','scheduled_unpublish_at','deleted_at','canonical_url','og_image','noindex','exclude_from_sitemap','seo_title','seo_description','created_by'],
  courses: ['id','title','slug','status','is_active','is_published','created_at','updated_at','deleted_at','canonical_url','noindex','seo_title','seo_description','created_by','exclude_from_sitemap','description'],
  tools_extended: ['id','slug','is_active','created_at','updated_at','deleted_at','created_by','title','name','description'],
  reusable_sections: ['id','slug','status','created_at','updated_at','deleted_at','published_at','title','name'],
  reusable_blocks: ['id','slug','status','created_at','updated_at','deleted_at','published_at','title','name'],
  page_templates: ['id','name','slug','template_type','template_data','is_default','created_at','updated_at','deleted_at','is_active','created_by','description'],
  sections: ['id','page_id','type','content_json','order_index','visibility','created_at','updated_at','section_type','page_slug'],
};

async function probeTable(client, table, columns) {
  // Probe in chunks of ~8 columns to avoid huge response payloads
  const missing = [];
  for (let i = 0; i < columns.length; i += 8) {
    const chunk = columns.slice(i, i + 8);
    const select = chunk.join(',');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=1`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const text = await res.text();
    if (res.ok) continue;
    let code = '';
    try { code = JSON.parse(text).code || ''; } catch {}
    const isMissingCol = text.toLowerCase().includes('does not exist') || code === '42703';
    const isMissingTable = res.status === 404 || text.toLowerCase().includes('could not find the table') || code === 'PGRST205';
    if (isMissingTable) {
      console.log(`  [TABLE MISSING] ${table}`);
      return 'missing_table';
    }
    if (isMissingCol) {
      // Determine which column(s) in the chunk are missing (binary search chunk)
      for (const col of chunk) {
        const single = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${col}&limit=1`, {
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
          cache: 'no-store',
        });
        const singleText = await single.text();
        if (!single.ok && (singleText.toLowerCase().includes('does not exist') || (JSON.parse(singleText).code === '42703'))) {
          missing.push(col);
        }
      }
    } else if (res.status !== 200) {
      // other error (RLS? grant?) — record it
      console.log(`  [OTHER ERROR] ${table} chunk ${chunk.join(',')}: ${res.status} ${text.slice(0, 120)}`);
    }
  }
  if (missing.length) {
    console.log(`  MISSING (${table}): ${missing.join(', ')}`);
  } else {
    console.log(`  OK (${table})`);
  }
  return 'ok';
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  console.log('Probing staging column existence via REST (read-only).\n');
  for (const [table, columns] of Object.entries(TABLES)) {
    await probeTable(clientPlaceholder(), table, columns);
  }
  console.log('\nDone.');
}
function clientPlaceholder() { return null; }

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });


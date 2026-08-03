/* Apply remaining migrations to local Supabase. */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

async function main() {
  const pg = new Client({
    host: '127.0.0.1', port: 54322,
    user: 'supabase_admin', password: 'postgres',
    database: 'postgres',
    connectionTimeoutMillis: 10000,
  });
  await pg.connect();
  console.log('Connected to local Supabase Postgres.');

  // Check existing tables
  const tables = await pg.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log('Existing tables:', tables.rows.map(r => r.table_name).join(', '));

  // Apply migrations in order
  const migrationFiles = [
    '202602110001_blog_placements.sql',
    '202602110002_cms.sql',
    '202602110003_home_sections.sql',
    '202602110004_page_sections.sql',
    '202602120001_blog_section.sql',
    '202602120002_hiring_partners.sql',
    '202602120003_homepage_refactor.sql',
    '202602120004_placement_page_sections.sql',
    '202602120005_tools_extended.sql',
    '202603060001_admin_seo_cms_upgrade.sql',
    '202603060002_profiles_trigger.sql',
    '202603130001_cms_expansion_pass2.sql',
    '202603130002_cms_global_settings_pass3.sql',
    '202603130003_cms_unification.sql',
    '202605200001_admin_cms_storage_alignment.sql',
    '202605200002_resources_tool_fk_alignment.sql',
    '202607220001_banner_management.sql',
    '202607220002_city_pages.sql',
    '202607220004_footer_builder.sql',
    '202607220005_form_builder.sql',
    '202607220006_global_settings.sql',
    '202607220007_header_builder.sql',
    '202607220008_health_dashboard.sql',
    '202607220009_homepage_builder.sql',
    '202607220010_maintenance_mode.sql',
    '202607220011_page_templates.sql',
    '202607220012_popup_management.sql',
    '202607220013_reusable_sections.sql',
    '202607220014_robots_txt.sql',
    '202607220015_seo_manager.sql',
    '202607220016_staging_workflow.sql',
    '202607220017_user_management_rbac.sql',
    '202607220018_version_history.sql',
    '202607220019_content_scheduling.sql',
    '202607290001_rbac_and_draft_privacy_hardening.sql',
    '202607290002_zzz_auth_profile_trigger_fix.sql',
    '202607310001_indexes.sql',
    '202607310002_rls_policies.sql',
    '202607310003_zzz_rls_regression_fix.sql',
    '202607310004_zzzz_cms_publish_contract.sql',
    '202607310005_public_api_grants.sql',
    '20260801_cms_production_fixes.sql',
  ];

  let applied = 0;
  let skipped = 0;
  let errors = [];

  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP ${file} (not found)`);
      skipped++;
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    try {
      await pg.query(sql);
      console.log(`  OK   ${file}`);
      applied++;
    } catch (e) {
      console.log(`  ERR  ${file}: ${e.message.slice(0, 120)}`);
      errors.push({ file, error: e.message });
    }
  }

  console.log(`\nApplied: ${applied}, Skipped: ${skipped}, Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const e of errors) {
      console.log(`  - ${e.file}: ${e.error.slice(0, 200)}`);
    }
  }

  await pg.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

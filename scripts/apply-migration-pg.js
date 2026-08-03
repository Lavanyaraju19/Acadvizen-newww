const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = 'postgresql://postgres:Acadvizen%212026Staging@hhfccftkfryesjirauwf.supabase.co:5432/postgres';

async function applyMigration() {
  console.log('Connecting to staging Supabase...');
  const client = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected.\n');

  const migrationFiles = [
    '20260128_phase1_hybrid_cms_base.sql',
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
    '20260527_admin_cms_schema_fix.sql',
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
    '202607300001_homepage_section_tables.sql',
    '202607310001_indexes.sql',
    '202607310002_rls_policies.sql',
    '202607310003_zzz_rls_regression_fix.sql',
    '202607310004_zzzz_cms_publish_contract.sql',
    '202607310005_public_api_grants.sql',
    '20260801_cms_production_fixes.sql',
  ];

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

  for (const filename of migrationFiles) {
    const filePath = path.join(migrationsDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP: ${filename} (not found)`);
      continue;
    }
    
    const sql = fs.readFileSync(filePath, 'utf8').trim();
    if (!sql) {
      console.log(`  SKIP: ${filename} (empty)`);
      continue;
    }

    console.log(`  APPLYING: ${filename} (${sql.length} chars)...`);
    
    try {
      await client.query(sql);
      console.log(`  OK: ${filename}`);
    } catch (err) {
      console.log(`  WARN: ${filename} - ${err.message}`);
      // Continue - many migrations are idempotent
    }
  }

  // Verify key tables now exist
  const tablesResult = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
  );
  console.log('\n=== TABLES AFTER MIGRATION ===');
  for (const t of tablesResult.rows) {
    console.log('  ' + t.table_name);
  }

  await client.end();
  console.log('\nDone.');
}

applyMigration().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

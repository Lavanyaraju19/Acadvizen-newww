# Phase 1 Hybrid CMS - Migration Instructions

## Database Migration Required

The Phase 1 Hybrid CMS requires new database tables to be created. Please follow these steps:

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/hhfccftkfryesjirauwf
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of: `supabase/migrations/20260128_phase1_hybrid_cms_base.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute the migration
7. Verify all 13 tables were created successfully

### Option 2: Apply via Command Line

If you have the Supabase CLI installed:

```bash
supabase db push
```

Or directly with psql:

```bash
psql -h aws-0-ap-south-1.pooler.supabase.com -p 6543 -U postgres.hhfccftkfryesjirauwf -d postgres -f supabase/migrations/20260128_phase1_hybrid_cms_base.sql
```

## Tables Created

The migration creates 13 new tables:
- homepage_hero
- homepage_course_highlights
- homepage_course_modules
- homepage_curriculum
- homepage_projects
- homepage_partners
- homepage_placements
- homepage_testimonials
- homepage_faq
- homepage_tools
- homepage_cta
- header_settings
- footer_settings

## After Migration

Once the migration is applied, the API routes will automatically:
- Connect to these tables
- Provide CRUD operations
- Enable content editing from the admin dashboard
- Allow the frontend to fetch CMS data

## Verification

After applying the migration, verify:
1. All 13 tables exist in the database
2. RLS policies are enabled
3. Triggers for updated_at are working
4. Default data is inserted

## Next Steps

After migration is complete, the application will:
- Use CMS data for homepage sections
- Allow editing via admin dashboard
- Publish changes without redeploy
- Maintain exact UI with CMS-controlled content

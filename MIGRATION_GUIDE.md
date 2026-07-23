# Database Migration Guide

## Missing Migrations to Apply

The following migrations need to be applied manually in the Supabase SQL Editor:

### 1. Banner Management (20260722_banner_management.sql)
- **File**: `supabase/migrations/20260722_banner_management.sql`
- **Purpose**: Create responsive banner management system
- **Tables**: `banners`

### 2. Popup Management (20260722_popup_management.sql)
- **File**: `supabase/migrations/20260722_popup_management.sql`
- **Purpose**: Create popup/overlay management system
- **Tables**: `popups`

### 3. Form Builder (20260722_form_builder.sql)
- **File**: `supabase/migrations/20260722_form_builder.sql`
- **Purpose**: Create visual form builder and form submissions
- **Tables**: `forms`, `form_submissions`

## How to Apply Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open each migration file and copy the SQL
4. Execute the SQL in the SQL Editor
5. Verify the tables were created successfully

## Alternative: Apply via Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

This will apply all pending migrations automatically.

## Verification

After applying migrations, run the test suite again:

```bash
node test-all-cms-modules.js
```

All modules should pass including banners, popups, and forms.

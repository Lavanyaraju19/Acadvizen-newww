-- Fixes bad data produced by the seed step in 202602120005_tools_extended.sql, which used
-- regexp_replace(website_url, '^https?://([^/]+).*$', '\\1') - a doubled backslash. In a
-- standard-conforming Postgres string literal '\\1' is the two literal characters `\` and `1`,
-- not the backreference `\1`, so every affected row's logo_url was set to the literal string
-- "https://logo.clearbit.com/\1" instead of "https://logo.clearbit.com/<hostname>". Confirmed
-- via browser network trace: /tools/<slug> pages request that literal broken URL through Next's
-- image optimizer, which 500s on it. This migration is additive/idempotent - it only touches
-- rows still holding that exact broken literal value, and does not modify the original
-- (already-applied) migration.
update public.tools_extended
set logo_url = 'https://logo.clearbit.com/' || regexp_replace(website_url, '^https?://([^/]+).*$', '\1')
where website_url is not null
  and logo_url = 'https://logo.clearbit.com/' || chr(92) || '1';

-- Reconciles 3 columns that exist in production but had no corresponding migration (discovered
-- by tests/unit/schema-contract.test.js, the regression test built earlier this session
-- specifically to catch this class of drift). Without this, rebuilding the database purely from
-- migration history (disaster recovery, a fresh environment, the local disposable dev stack)
-- would be missing columns the live application already depends on. Purely additive/idempotent;
-- matches production's actual current types/defaults exactly, so re-running this against
-- production is a safe no-op.

alter table public.courses add column if not exists published boolean default true;
alter table public.locations add column if not exists faqs jsonb;
alter table public.locations add column if not exists seo_priority numeric default 0.7;

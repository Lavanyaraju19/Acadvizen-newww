-- Replay protection for /api/wordpress/content (WordPress central admin → Main content).
-- Every change request carries a unique request_id; the API claims it here before acting, so a
-- captured request cannot be replayed on another server instance. Additive only: one new table,
-- no change to existing data. Only the server (service role) reads or writes it.
--
-- Roll back: drop table if exists public.wordpress_content_requests;
-- (the API then refuses changes with 503 replay_protection_unavailable until it exists again).

create table if not exists public.wordpress_content_requests (
  request_id uuid primary key,
  op text,
  entity text,
  received_at timestamptz not null default now()
);

create index if not exists wordpress_content_requests_received_at_idx
  on public.wordpress_content_requests (received_at);

alter table public.wordpress_content_requests enable row level security;
-- No policies: anon and authenticated users have no access; the service role bypasses RLS.
revoke all on table public.wordpress_content_requests from anon, authenticated;

-- Phase 5: full internal-linking engine. `lib/internalLinker.ts` only ever did in-memory
-- relevance scoring for one renderer (CityCoursePageRenderer) - nothing persisted a decision, so
-- there was no way for an admin to accept/reject/ignore a suggestion or manually add/remove a
-- link. These two tables store exactly that decision state; the link graph itself (nodes, outgoing
-- links, incoming links, broken links, orphans) is computed live from real CMS content by
-- lib/internalLinkGraph.js and is never persisted, so it can't go stale.
--
-- internal_link_suggestions: system-proposed relationships (same course/city/category/tags/topic).
-- Regenerated on every admin read (upsert, so re-running never duplicates or resurrects a
-- rejected suggestion - the unique index is the guard). Accepting a suggestion never touches
-- public content; it only flags it here so the admin knows to add the link themselves, per the
-- "do not insert uncontrolled automatic links into production content" requirement.
--
-- internal_link_edges: manually declared links an admin adds directly in the Internal Links admin
-- screen (or promotes from an accepted suggestion). Also admin-only bookkeeping, not auto-rendered
-- on the public site.

create table if not exists public.internal_link_suggestions (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  source_title text,
  source_url text not null,
  target_type text not null,
  target_id uuid not null,
  target_title text,
  target_url text not null,
  reason text not null,
  score numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'ignored')),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists internal_link_suggestions_pair_idx
  on public.internal_link_suggestions (source_type, source_id, target_type, target_id);
create index if not exists internal_link_suggestions_status_idx on public.internal_link_suggestions(status);

create table if not exists public.internal_link_edges (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  source_title text,
  source_url text not null,
  target_type text not null,
  target_id uuid not null,
  target_title text,
  target_url text not null,
  label text,
  origin text not null default 'manual' check (origin in ('manual', 'accepted_suggestion')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index if not exists internal_link_edges_source_idx on public.internal_link_edges(source_type, source_id);
create index if not exists internal_link_edges_target_idx on public.internal_link_edges(target_type, target_id);

alter table public.internal_link_suggestions enable row level security;
drop policy if exists "internal_link_suggestions_service_role_all" on public.internal_link_suggestions;
create policy "internal_link_suggestions_service_role_all" on public.internal_link_suggestions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table public.internal_link_edges enable row level security;
drop policy if exists "internal_link_edges_service_role_all" on public.internal_link_edges;
create policy "internal_link_edges_service_role_all" on public.internal_link_edges
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Staged editing ("shadow row" drafts) for pages + locations, Phase 1 of the draft/preview/
-- publish workflow. Purely additive: new nullable columns, one new table, and new functions.
-- No existing column, table, row, or index is touched here - the one non-additive change this
-- feature needs (replacing the plain slug-unique indexes with partial ones that exclude shadow
-- drafts) ships separately in 202608130002, gated on explicit sign-off, since it modifies an
-- existing schema object rather than only adding new ones.
--
-- Design: a draft of an ALREADY-PUBLISHED page/location is a normal second row in the same
-- table, linked to the live row via draft_of_id. Its sections/location_sections attach through
-- the existing page_id/location_id FK, so no schema change is needed there at all - the existing
-- section CRUD, existing Page Builder form, and existing Locations form all keep working
-- unchanged, just pointed at the shadow's id while a draft is being edited. Brand-new content
-- (never published) needs no shadow: it's just a row with draft_of_id = null and
-- status='draft'/is_active=false, exactly like today.

-- 1. Shadow-draft column on pages
alter table public.pages
  add column if not exists draft_of_id uuid references public.pages(id) on delete cascade;
create index if not exists idx_pages_draft_of_id on public.pages(draft_of_id);

-- 2. Shadow-draft column on locations
alter table public.locations
  add column if not exists draft_of_id uuid references public.locations(id) on delete cascade;
create index if not exists idx_locations_draft_of_id on public.locations(draft_of_id);

-- 3. location_versions - mirrors page_versions (supabase/migrations/202607220018_version_history.sql)
-- exactly, so locations get the same pre-publish rollback safety net pages already have. Snapshots
-- the full row as JSON (locations has no single "content" column the way pages does).
create table if not exists public.location_versions (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  version_number int not null,
  snapshot_json jsonb,
  is_active boolean,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  notes text,
  change_summary text
);

create index if not exists idx_location_versions_location_id on public.location_versions(location_id);
create index if not exists idx_location_versions_created_at on public.location_versions(created_at desc);
create index if not exists idx_location_versions_version_number on public.location_versions(location_id, version_number desc);

alter table public.location_versions enable row level security;

drop policy if exists "location_versions_admin_all" on public.location_versions;
create policy "location_versions_admin_all"
on public.location_versions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 4. create_location_version() - same contract as the existing create_page_version().
create or replace function public.create_location_version(
  p_location_id uuid,
  p_snapshot_json jsonb,
  p_is_active boolean,
  p_notes text default null,
  p_change_summary text default null
)
returns uuid
language plpgsql
as $$
declare
  v_version_number int;
  v_id uuid;
begin
  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.location_versions
  where location_id = p_location_id;

  insert into public.location_versions (
    location_id, version_number, snapshot_json, is_active, created_by, notes, change_summary
  ) values (
    p_location_id, v_version_number, p_snapshot_json, p_is_active, auth.uid(), p_notes, p_change_summary
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- 5. publish_page_draft(draft_id) - single-transaction merge so a publish can never partially
-- apply. Two branches: the given row IS the primary row (brand-new content, first-ever publish -
-- just flip it published), or the given row is a shadow of an already-live page (merge onto the
-- live row it shadows, snapshotting the live row's prior state first for rollback safety).
create or replace function public.publish_page_draft(p_draft_id uuid)
returns public.pages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.pages;
  v_live_id uuid;
  v_live public.pages;
begin
  select * into v_draft from public.pages where id = p_draft_id;
  if v_draft.id is null then
    raise exception 'Page % not found', p_draft_id;
  end if;

  if v_draft.draft_of_id is null then
    perform public.create_page_version(
      v_draft.id, v_draft.content, v_draft.seo_title, v_draft.seo_description, 'published',
      null, 'Published'
    );
    update public.pages
      set status = 'published', published_at = coalesce(published_at, now())
      where id = v_draft.id
      returning * into v_live;
    return v_live;
  end if;

  v_live_id := v_draft.draft_of_id;
  select * into v_live from public.pages where id = v_live_id;
  if v_live.id is null then
    raise exception 'Live page % (draft target) not found', v_live_id;
  end if;

  -- Snapshot the CURRENT live state before it's overwritten.
  perform public.create_page_version(
    v_live.id, v_live.content, v_live.seo_title, v_live.seo_description, v_live.status,
    null, 'Pre-publish snapshot (about to be replaced by draft)'
  );

  -- Re-parent the shadow's sections onto the live id, after clearing the live row's old ones.
  -- Order matters: sections.page_id cascades from pages, so the shadow's sections must move to
  -- the live id BEFORE the shadow row itself is deleted below, or they'd cascade-delete with it.
  delete from public.sections where page_id = v_live.id;
  update public.sections set page_id = v_live.id where page_id = v_draft.id;

  update public.pages set
    title = v_draft.title,
    slug = v_draft.slug,
    description = v_draft.description,
    seo_title = v_draft.seo_title,
    seo_description = v_draft.seo_description,
    canonical_url = v_draft.canonical_url,
    og_image = v_draft.og_image,
    noindex = v_draft.noindex,
    content = v_draft.content,
    sections_json = v_draft.sections_json,
    page_template_id = v_draft.page_template_id,
    parent_id = v_draft.parent_id,
    order_index = v_draft.order_index,
    scheduled_publish_at = v_draft.scheduled_publish_at,
    scheduled_unpublish_at = v_draft.scheduled_unpublish_at,
    status = 'published',
    published_at = coalesce(v_live.published_at, now())
    where id = v_live.id
    returning * into v_live;

  delete from public.pages where id = v_draft.id;

  return v_live;
end;
$$;

-- 6. publish_location_draft(draft_id) - same two-branch contract for locations.
create or replace function public.publish_location_draft(p_draft_id uuid)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.locations;
  v_live_id uuid;
  v_live public.locations;
begin
  select * into v_draft from public.locations where id = p_draft_id;
  if v_draft.id is null then
    raise exception 'Location % not found', p_draft_id;
  end if;

  if v_draft.draft_of_id is null then
    perform public.create_location_version(v_draft.id, to_jsonb(v_draft), true, null, 'Published');
    update public.locations set is_active = true where id = v_draft.id returning * into v_live;
    return v_live;
  end if;

  v_live_id := v_draft.draft_of_id;
  select * into v_live from public.locations where id = v_live_id;
  if v_live.id is null then
    raise exception 'Live location % (draft target) not found', v_live_id;
  end if;

  perform public.create_location_version(
    v_live.id, to_jsonb(v_live), v_live.is_active, null,
    'Pre-publish snapshot (about to be replaced by draft)'
  );

  delete from public.location_sections where location_id = v_live.id;
  update public.location_sections set location_id = v_live.id where location_id = v_draft.id;

  update public.locations set
    name = v_draft.name,
    slug = v_draft.slug,
    footer_label = v_draft.footer_label,
    meta_title = v_draft.meta_title,
    meta_description = v_draft.meta_description,
    intro_text = v_draft.intro_text,
    why_text = v_draft.why_text,
    demand_text = v_draft.demand_text,
    faqs = v_draft.faqs,
    address = v_draft.address,
    latitude = v_draft.latitude,
    longitude = v_draft.longitude,
    phone = v_draft.phone,
    whatsapp = v_draft.whatsapp,
    city_id = v_draft.city_id,
    order_index = v_draft.order_index,
    seo_priority = v_draft.seo_priority,
    is_active = true
    where id = v_live.id
    returning * into v_live;

  delete from public.locations where id = v_draft.id;

  return v_live;
end;
$$;

grant execute on function public.publish_page_draft(uuid) to authenticated, service_role;
grant execute on function public.publish_location_draft(uuid) to authenticated, service_role;
grant execute on function public.create_location_version(uuid, jsonb, boolean, text, text) to authenticated, service_role;

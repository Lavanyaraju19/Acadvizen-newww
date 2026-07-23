-- Website Health Dashboard Schema
-- Create tables for health tracking and notifications

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Health scan results table
create table if not exists public.health_scans (
  id uuid primary key default gen_random_uuid(),
  scan_date timestamptz not null default now(),
  
  -- SEO Health
  seo_missing_meta_titles int default 0,
  seo_missing_meta_descriptions int default 0,
  seo_missing_h1 int default 0,
  seo_missing_alt_text int default 0,
  seo_missing_canonical int default 0,
  seo_missing_og_image int default 0,
  seo_missing_focus_keyword int default 0,
  seo_duplicate_titles int default 0,
  seo_duplicate_descriptions int default 0,
  seo_score int default 0,
  
  -- Content Health
  content_draft_pages int default 0,
  content_scheduled_content int default 0,
  content_unpublished_pages int default 0,
  content_empty_pages int default 0,
  content_broken_images int default 0,
  content_missing_featured int default 0,
  content_score int default 0,
  
  -- Link Health
  link_broken_internal int default 0,
  link_broken_external int default 0,
  link_redirect_chains int default 0,
  link_missing_redirects int default 0,
  link_404_pages int default 0,
  link_score int default 0,
  
  -- Media Health
  media_large_images int default 0,
  media_duplicate_images int default 0,
  media_unused_images int default 0,
  media_missing_alt int default 0,
  media_unsupported_formats int default 0,
  media_score int default 0,
  
  -- Performance
  perf_slow_pages int default 0,
  perf_large_assets int default 0,
  perf_slow_images int default 0,
  perf_cache_status text default 'unknown',
  perf_score int default 0,
  
  -- Overall
  overall_score int default 0,
  overall_status text default 'healthy' check (overall_status in ('healthy', 'warning', 'critical')),
  
  scanned_by uuid references public.profiles(id)
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('lead', 'backup', 'backup_failed', 'content_published', 'content_failed', 'user_created', 'seo_issue', 'storage_warning', 'form_submission', 'popup_expired', 'banner_expired', 'system_error', 'permission_change')),
  title text not null,
  message text,
  entity_type text,
  entity_id uuid,
  is_read boolean default false,
  created_at timestamptz not null default now(),
  user_id uuid references public.profiles(id)
);

-- Redirects table
create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  old_url text not null unique,
  new_url text not null,
  redirect_type int default 301 check (redirect_type in (301, 302)),
  is_active boolean default true,
  hits int default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Activity log table
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  user_role text,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_health_scans_date on public.health_scans(scan_date desc);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read, created_at desc);
create index if not exists idx_redirects_old on public.redirects(old_url);
create index if not exists idx_redirects_active on public.redirects(is_active);
create index if not exists idx_activity_log_user on public.activity_log(user_id, created_at desc);
create index if not exists idx_activity_log_entity on public.activity_log(entity_type, entity_id);

-- Triggers
drop trigger if exists set_redirects_updated_at on public.redirects;
create trigger set_redirects_updated_at
before update on public.redirects
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.health_scans enable row level security;
alter table public.notifications enable row level security;
alter table public.redirects enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "health_scans_admin_all" on public.health_scans;
create policy "health_scans_admin_all"
on public.health_scans for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "notifications_user_read" on public.notifications;
create policy "notifications_user_read"
on public.notifications for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_user_write" on public.notifications;
create policy "notifications_user_write"
on public.notifications for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "redirects_admin_all" on public.redirects;
create policy "redirects_admin_all"
on public.redirects for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "activity_log_admin_all" on public.activity_log;
create policy "activity_log_admin_all"
on public.activity_log for all to authenticated
using (public.is_admin())
with check (public.is_admin());
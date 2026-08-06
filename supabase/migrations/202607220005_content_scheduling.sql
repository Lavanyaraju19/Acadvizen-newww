-- Content Scheduling Schema
-- Add scheduling fields to CMS tables

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

-- Add scheduling columns to pages
alter table public.pages
add column if not exists scheduled_publish_at timestamptz,
add column if not exists scheduled_unpublish_at timestamptz,
add column if not exists auto_publish boolean default false;

-- Add scheduling columns to blogs
alter table public.blogs
add column if not exists scheduled_publish_at timestamptz,
add column if not exists scheduled_unpublish_at timestamptz,
add column if not exists auto_publish boolean default false;

-- Add scheduling columns to banners
alter table public.banners
add column if not exists scheduled_publish_at timestamptz,
add column if not exists scheduled_unpublish_at timestamptz,
add column if not exists auto_publish boolean default false;

-- Add scheduling columns to popups
alter table public.popups
add column if not exists scheduled_publish_at timestamptz,
add column if not exists scheduled_unpublish_at timestamptz,
add column if not exists auto_publish boolean default false;

-- Create indexes for scheduled items
create index if not exists idx_pages_scheduled_publish on public.pages(scheduled_publish_at) where scheduled_publish_at is not null;
create index if not exists idx_pages_scheduled_unpublish on public.pages(scheduled_unpublish_at) where scheduled_unpublish_at is not null;

create index if not exists idx_blogs_scheduled_publish on public.blogs(scheduled_publish_at) where scheduled_publish_at is not null;
create index if not exists idx_blogs_scheduled_unpublish on public.blogs(scheduled_unpublish_at) where scheduled_unpublish_at is not null;

create index if not exists idx_banners_scheduled_publish on public.banners(scheduled_publish_at) where scheduled_publish_at is not null;
create index if not exists idx_banners_scheduled_unpublish on public.banners(scheduled_unpublish_at) where scheduled_unpublish_at is not null;

create index if not exists idx_popups_scheduled_publish on public.popups(scheduled_publish_at) where scheduled_publish_at is not null;
create index if not exists idx_popups_scheduled_unpublish on public.popups(scheduled_unpublish_at) where scheduled_unpublish_at is not null;

-- Function to handle scheduled publishing
create or replace function public.handle_scheduled_publishing()
returns void
language plpgsql
as $$
begin
  -- Publish pages
  update public.pages
  set status = 'published', scheduled_publish_at = null
  where auto_publish = true
    and scheduled_publish_at is not null
    and scheduled_publish_at <= now()
    and status = 'draft';

  -- Unpublish pages
  update public.pages
  set status = 'draft', scheduled_unpublish_at = null
  where scheduled_unpublish_at is not null
    and scheduled_unpublish_at <= now()
    and status = 'published';

  -- Publish blogs
  update public.blogs
  set status = 'published', scheduled_publish_at = null
  where auto_publish = true
    and scheduled_publish_at is not null
    and scheduled_publish_at <= now()
    and status = 'draft';

  -- Unpublish blogs
  update public.blogs
  set status = 'draft', scheduled_unpublish_at = null
  where scheduled_unpublish_at is not null
    and scheduled_unpublish_at <= now()
    and status = 'published';

  -- Publish banners
  update public.banners
  set status = 'published', scheduled_publish_at = null
  where auto_publish = true
    and scheduled_publish_at is not null
    and scheduled_publish_at <= now()
    and status = 'draft';

  -- Unpublish banners
  update public.banners
  set status = 'draft', scheduled_unpublish_at = null
  where scheduled_unpublish_at is not null
    and scheduled_unpublish_at <= now()
    and status = 'published';

  -- Publish popups
  update public.popups
  set status = 'published', scheduled_publish_at = null
  where auto_publish = true
    and scheduled_publish_at is not null
    and scheduled_publish_at <= now()
    and status = 'draft';

  -- Unpublish popups
  update public.popups
  set status = 'draft', scheduled_unpublish_at = null
  where scheduled_unpublish_at is not null
    and scheduled_unpublish_at <= now()
    and status = 'published';
end;
$$;

-- Function to get scheduled items for admin dashboard
create or replace function public.get_scheduled_items()
returns table (
  item_type text,
  item_id uuid,
  item_title text,
  scheduled_at timestamptz,
  action text,
  status text
)
language sql
as $$
  -- Pages to publish
  select 'page' as item_type, id as item_id, title as item_title, 
         scheduled_publish_at as scheduled_at, 'publish' as action, status
  from public.pages
  where scheduled_publish_at is not null and auto_publish = true
  
  union all
  
  -- Pages to unpublish
  select 'page' as item_type, id as item_id, title as item_title, 
         scheduled_unpublish_at as scheduled_at, 'unpublish' as action, status
  from public.pages
  where scheduled_unpublish_at is not null
  
  union all
  
  -- Blogs to publish
  select 'blog' as item_type, id as item_id, title as item_title, 
         scheduled_publish_at as scheduled_at, 'publish' as action, status
  from public.blogs
  where scheduled_publish_at is not null and auto_publish = true
  
  union all
  
  -- Blogs to unpublish
  select 'blog' as item_type, id as item_id, title as item_title, 
         scheduled_unpublish_at as scheduled_at, 'unpublish' as action, status
  from public.blogs
  where scheduled_unpublish_at is not null
  
  union all
  
  -- Banners to publish
  select 'banner' as item_type, id as item_id, name as item_title, 
         scheduled_publish_at as scheduled_at, 'publish' as action, status
  from public.banners
  where scheduled_publish_at is not null and auto_publish = true
  
  union all
  
  -- Banners to unpublish
  select 'banner' as item_type, id as item_id, name as item_title, 
         scheduled_unpublish_at as scheduled_at, 'unpublish' as action, status
  from public.banners
  where scheduled_unpublish_at is not null
  
  union all
  
  -- Popups to publish
  select 'popup' as item_type, id as item_id, name as item_title, 
         scheduled_publish_at as scheduled_at, 'publish' as action, status
  from public.popups
  where scheduled_publish_at is not null and auto_publish = true
  
  union all
  
  -- Popups to unpublish
  select 'popup' as item_type, id as item_id, name as item_title, 
         scheduled_unpublish_at as scheduled_at, 'unpublish' as action, status
  from public.popups
  where scheduled_unpublish_at is not null
  
  order by scheduled_at asc;
$$;
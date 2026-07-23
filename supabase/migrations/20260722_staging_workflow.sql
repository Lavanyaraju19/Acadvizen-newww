-- Staging Workflow Schema
-- Add workflow status to CMS entities

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

-- Add workflow status columns
alter table public.pages
add column if not exists workflow_status text default 'draft' check (workflow_status in ('draft', 'review', 'approved', 'published')),
add column if not exists reviewed_by uuid references public.profiles(id),
add column if not exists reviewed_at timestamptz,
add column if not exists approved_by uuid references public.profiles(id),
add column if not exists approved_at timestamptz,
add column if not exists published_by uuid references public.profiles(id),
add column if not exists published_at timestamptz;

alter table public.blogs
add column if not exists workflow_status text default 'draft' check (workflow_status in ('draft', 'review', 'approved', 'published')),
add column if not exists reviewed_by uuid references public.profiles(id),
add column if not exists reviewed_at timestamptz,
add column if not exists approved_by uuid references public.profiles(id),
add column if not exists approved_at timestamptz,
add column if not exists published_by uuid references public.profiles(id),
add column if not exists published_at timestamptz;

-- Create indexes for workflow
create index if not exists idx_pages_workflow_status on public.pages(workflow_status);
create index if not exists idx_blogs_workflow_status on public.blogs(workflow_status);

-- Function to advance workflow
create or replace function public.advance_workflow(
  p_entity_type text,
  p_entity_id uuid,
  p_new_status text,
  p_user_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_current_status text;
  v_table_name text;
  v_result jsonb;
begin
  p_new_status := lower(p_new_status);
  p_entity_type := lower(p_entity_type);
  
  -- Determine table
  if p_entity_type = 'page' then
    v_table_name := 'public.pages';
  elsif p_entity_type = 'blog' then
    v_table_name := 'public.blogs';
  else
    return jsonb_build_object('error', 'Invalid entity type');
  end if;
  
  -- Get current status
  execute format('SELECT workflow_status FROM %I WHERE id = $1', v_table_name)
  into v_current_status
  using p_entity_id;
  
  -- Validate workflow transition
  if v_current_status = 'draft' and p_new_status not in ('review', 'published') then
    return jsonb_build_object('error', 'Invalid workflow transition');
  end if;
  
  if v_current_status = 'review' and p_new_status not in ('approved', 'draft') then
    return jsonb_build_object('error', 'Invalid workflow transition');
  end if;
  
  if v_current_status = 'approved' and p_new_status not in ('published', 'review') then
    return jsonb_build_object('error', 'Invalid workflow transition');
  end if;
  
  -- Update workflow status
  if p_new_status = 'review' then
    execute format('
      UPDATE %I 
      SET workflow_status = $1, reviewed_by = $2, reviewed_at = now()
      WHERE id = $3
    ', v_table_name)
    using p_new_status, p_user_id, p_entity_id;
  elsif p_new_status = 'approved' then
    execute format('
      UPDATE %I 
      SET workflow_status = $1, approved_by = $2, approved_at = now()
      WHERE id = $3
    ', v_table_name)
    using p_new_status, p_user_id, p_entity_id;
  elsif p_new_status = 'published' then
    execute format('
      UPDATE %I 
      SET workflow_status = $1, published_by = $2, published_at = now(), status = ''published''
      WHERE id = $3
    ', v_table_name)
    using p_new_status, p_user_id, p_entity_id;
  elsif p_new_status = 'draft' then
    execute format('
      UPDATE %I 
      SET workflow_status = $1, status = ''draft''
      WHERE id = $3
    ', v_table_name)
    using p_new_status, p_entity_id;
  end if;
  
  return jsonb_build_object('success', true, 'status', p_new_status);
end;
$$;

-- Function to get workflow queue for review
create or replace function public.get_workflow_queue()
returns table (
  entity_type text,
  entity_id uuid,
  entity_title text,
  workflow_status text,
  created_at timestamptz,
  author_name text
)
language sql
as $$
  -- Pages in review
  select 'page' as entity_type, id as entity_id, title as entity_title,
         workflow_status, created_at,
         (select full_name from public.profiles where id = pages.created_by) as author_name
  from public.pages
  where workflow_status = 'review'
  
  union all
  
  -- Blogs in review
  select 'blog' as entity_type, id as entity_id, title as entity_title,
         workflow_status, created_at,
         (select full_name from public.profiles where id = blogs.created_by) as author_name
  from public.blogs
  where workflow_status = 'review'
  
  order by created_at asc;
$$;
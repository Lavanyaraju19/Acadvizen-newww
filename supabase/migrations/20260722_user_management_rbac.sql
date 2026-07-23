-- User Management and Role-Based Access Control Schema

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

-- Create roles table
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  is_system_role boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create user_roles table for assigning roles to users
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique(user_id, role_id)
);

-- Create audit_log table
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role_id on public.user_roles(role_id);
create index if not exists idx_audit_log_user_id on public.audit_log(user_id);
create index if not exists idx_audit_log_entity on public.audit_log(entity_type, entity_id);
create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);

-- Trigger for updated_at on roles
drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

-- Insert default system roles
insert into public.roles (name, slug, description, permissions, is_system_role) values
('Super Admin', 'super_admin', 'Full access to all features including user management', '{
  "pages": ["create", "read", "update", "delete", "publish"],
  "blogs": ["create", "read", "update", "delete", "publish"],
  "courses": ["create", "read", "update", "delete", "publish"],
  "media": ["create", "read", "update", "delete"],
  "forms": ["create", "read", "update", "delete"],
  "popups": ["create", "read", "update", "delete"],
  "banners": ["create", "read", "update", "delete"],
  "settings": ["read", "update"],
  "users": ["create", "read", "update", "delete"],
  "roles": ["create", "read", "update", "delete"],
  "seo": ["read", "update"],
  "analytics": ["read"],
  "backup": ["create", "restore"]
}'::jsonb, true),
('Admin', 'admin', 'Full content management access without user management', '{
  "pages": ["create", "read", "update", "delete", "publish"],
  "blogs": ["create", "read", "update", "delete", "publish"],
  "courses": ["create", "read", "update", "delete", "publish"],
  "media": ["create", "read", "update", "delete"],
  "forms": ["create", "read", "update", "delete"],
  "popups": ["create", "read", "update", "delete"],
  "banners": ["create", "read", "update", "delete"],
  "settings": ["read", "update"],
  "seo": ["read", "update"],
  "analytics": ["read"]
}'::jsonb, true),
('Editor', 'editor', 'Can edit and publish content but no settings access', '{
  "pages": ["create", "read", "update", "publish"],
  "blogs": ["create", "read", "update", "publish"],
  "courses": ["create", "read", "update", "publish"],
  "media": ["create", "read", "update"],
  "forms": ["create", "read", "update"],
  "popups": ["create", "read", "update"],
  "banners": ["create", "read", "update"],
  "seo": ["read", "update"]
}'::jsonb, true),
('SEO Manager', 'seo_manager', 'SEO and content management with limited access', '{
  "pages": ["read", "update"],
  "blogs": ["read", "update"],
  "courses": ["read", "update"],
  "seo": ["read", "update"],
  "analytics": ["read"]
}'::jsonb, true),
('Content Writer', 'content_writer', 'Can create and edit content draft only', '{
  "pages": ["create", "read", "update"],
  "blogs": ["create", "read", "update"],
  "courses": ["create", "read", "update"],
  "media": ["create", "read"]
}'::jsonb, true),
('Viewer', 'viewer', 'Read-only access to all content', '{
  "pages": ["read"],
  "blogs": ["read"],
  "courses": ["read"],
  "media": ["read"],
  "analytics": ["read"]
}'::jsonb, true)
on conflict (slug) do nothing;

-- Function to check user permission
create or replace function public.has_permission(user_id uuid, permission text, action text)
returns boolean
language plpgsql
as $$
declare
  has_perm boolean;
begin
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = user_id
      and (r.permissions->permission)::jsonb ? action
  ) into has_perm;
  
  return has_perm;
end;
$$;

-- Function to log audit
create or replace function public.log_audit(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_changes jsonb,
  p_ip_address text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    ip_address,
    user_agent
  ) values (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_changes,
    p_ip_address,
    p_user_agent
  )
  returning id into v_id;
  
  return v_id;
end;
$$;

-- RLS policies
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_log enable row level security;

-- Roles: admin full access
drop policy if exists "roles_admin_all" on public.roles;
create policy "roles_admin_all"
on public.roles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- User roles: admin full access
drop policy if exists "user_roles_admin_all" on public.user_roles;
create policy "user_roles_admin_all"
on public.user_roles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Audit log: admin full access
drop policy if exists "audit_log_admin_all" on public.audit_log;
create policy "audit_log_admin_all"
on public.audit_log for all to authenticated
using (public.is_admin())
with check (public.is_admin());
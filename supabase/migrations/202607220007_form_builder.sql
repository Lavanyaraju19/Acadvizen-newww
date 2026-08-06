-- Form Builder and Form Submissions Schema
-- Create tables for visual form builder and form submissions

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

-- Forms table for storing form definitions
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  success_message text default 'Thank you for your submission!',
  error_message text default 'Please fix the errors and try again.',
  redirect_url text,
  send_email boolean default false,
  email_to text,
  email_subject text,
  store_submissions boolean default true,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Form submissions table
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  submission_data jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_forms_status on public.forms(status);
create index if not exists idx_forms_updated_at on public.forms(updated_at desc);
create index if not exists idx_form_submissions_form_id on public.form_submissions(form_id);
create index if not exists idx_form_submissions_status on public.form_submissions(status);
create index if not exists idx_form_submissions_created_at on public.form_submissions(created_at desc);

-- Triggers for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_forms_updated_at on public.forms;
create trigger set_forms_updated_at
before update on public.forms
for each row execute function public.set_updated_at();

drop trigger if exists set_form_submissions_updated_at on public.form_submissions;
create trigger set_form_submissions_updated_at
before update on public.form_submissions
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.forms enable row level security;
alter table public.form_submissions enable row level security;

-- Forms: public read published, admin full access
drop policy if exists "forms_public_select" on public.forms;
create policy "forms_public_select"
on public.forms for select to anon, authenticated
using (status = 'published');

drop policy if exists "forms_admin_write" on public.forms;
create policy "forms_admin_write"
on public.forms for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Form submissions: public insert, admin full access
drop policy if exists "form_submissions_public_insert" on public.form_submissions;
create policy "form_submissions_public_insert"
on public.form_submissions for insert to anon, authenticated
with check (true);

drop policy if exists "form_submissions_admin_select" on public.form_submissions;
create policy "form_submissions_admin_select"
on public.form_submissions for select to authenticated
using (public.is_admin());

drop policy if exists "form_submissions_admin_write" on public.form_submissions;
create policy "form_submissions_admin_write"
on public.form_submissions for all to authenticated
using (public.is_admin())
with check (public.is_admin());
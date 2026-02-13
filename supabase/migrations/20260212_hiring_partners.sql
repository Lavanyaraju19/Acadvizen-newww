create table if not exists public.hiring_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  row_group text default 'row_a',
  order_index integer default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.hiring_partners enable row level security;
drop policy if exists "hiring_partners_public_select" on public.hiring_partners;
create policy "hiring_partners_public_select"
  on public.hiring_partners
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "hiring_partners_admin_write" on public.hiring_partners;
create policy "hiring_partners_admin_write"
  on public.hiring_partners
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.hiring_partners (name, logo_url, row_group, order_index, is_active)
values
  ('TCS','https://logo.clearbit.com/tcs.com','row_a',1,true),
  ('Atlassian','https://logo.clearbit.com/atlassian.com','row_a',2,true),
  ('Adobe','https://logo.clearbit.com/adobe.com','row_a',3,true),
  ('Oracle','https://logo.clearbit.com/oracle.com','row_a',4,true),
  ('Google','https://logo.clearbit.com/google.com','row_a',5,true),
  ('Develop','https://logo.clearbit.com/develup.co','row_a',6,true),
  ('Dentsu','https://logo.clearbit.com/dentsu.com','row_a',7,true),
  ('Flipkart','https://logo.clearbit.com/flipkart.com','row_a',8,true),
  ('Continental','https://logo.clearbit.com/continental.com','row_a',9,true),
  ('Yahoo','https://logo.clearbit.com/yahoo.com','row_a',10,true),
  ('Replicon','https://logo.clearbit.com/replicon.com','row_a',11,true),
  ('KTM','https://logo.clearbit.com/ktm.com','row_a',12,true),
  ('Jungle Square','https://logo.clearbit.com/junglesquare.com','row_a',13,true),
  ('Infosys','https://logo.clearbit.com/infosys.com','row_a',14,true),
  ('IBM','https://logo.clearbit.com/ibm.com','row_a',15,true),
  ('Microsoft','https://logo.clearbit.com/microsoft.com','row_a',16,true),
  ('Accenture','https://logo.clearbit.com/accenture.com','row_a',17,true),
  ('Amazon','https://logo.clearbit.com/amazon.com','row_a',18,true),
  ('Bosch','https://logo.clearbit.com/bosch.com','row_a',19,true),
  ('Zomato','https://logo.clearbit.com/zomato.com','row_a',20,true),

  ('AXA','https://logo.clearbit.com/axa.com','row_b',1,true),
  ('Lakme','https://logo.clearbit.com/lakmeindia.com','row_b',2,true),
  ('Redditt','https://logo.clearbit.com/reddit.com','row_b',3,true),
  ('Zoho','https://logo.clearbit.com/zoho.com','row_b',4,true),
  ('Salesforce','https://logo.clearbit.com/salesforce.com','row_b',5,true),
  ('HubSpot','https://logo.clearbit.com/hubspot.com','row_b',6,true),
  ('Wipro','https://logo.clearbit.com/wipro.com','row_b',7,true),
  ('Deloitte','https://logo.clearbit.com/deloitte.com','row_b',8,true),
  ('KPMG','https://logo.clearbit.com/kpmg.com','row_b',9,true),
  ('EY','https://logo.clearbit.com/ey.com','row_b',10,true),
  ('Capgemini','https://logo.clearbit.com/capgemini.com','row_b',11,true),
  ('Cognizant','https://logo.clearbit.com/cognizant.com','row_b',12,true),
  ('SAP','https://logo.clearbit.com/sap.com','row_b',13,true),
  ('Intel','https://logo.clearbit.com/intel.com','row_b',14,true),
  ('Nvidia','https://logo.clearbit.com/nvidia.com','row_b',15,true),
  ('Paytm','https://logo.clearbit.com/paytm.com','row_b',16,true),
  ('Swiggy','https://logo.clearbit.com/swiggy.com','row_b',17,true),
  ('Nykaa','https://logo.clearbit.com/nykaa.com','row_b',18,true),
  ('Meta','https://logo.clearbit.com/meta.com','row_b',19,true),
  ('LinkedIn','https://logo.clearbit.com/linkedin.com','row_b',20,true)
on conflict do nothing;

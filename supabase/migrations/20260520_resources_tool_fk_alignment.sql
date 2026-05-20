alter table public.resources
  drop constraint if exists resources_tool_id_fkey;

update public.resources
set tool_id = null
where tool_id is not null
  and tool_id not in (select id from public.tools_extended);

alter table public.resources
  add constraint resources_tool_id_fkey
  foreign key (tool_id)
  references public.tools_extended(id)
  on delete set null;

alter table public.tasks
  add column if not exists sort_order int;

with ordered as (
  select id, row_number() over (order by created_at) as rn
  from public.tasks
)
update public.tasks t
set sort_order = ordered.rn
from ordered
where ordered.id = t.id;

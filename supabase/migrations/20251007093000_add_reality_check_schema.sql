do $$
begin
  if not exists (select 1 from pg_type where typname = 'reality_check_stage') then
    create type reality_check_stage as enum ('none','warning','alert','intervention','auto_archive');
  end if;
end
$$;

-- Add columns to tasks table
alter table public.tasks
  add column if not exists reality_check_stage reality_check_stage not null default 'none';

alter table public.tasks
  add column if not exists reality_check_due_at timestamptz;

-- Event history table
create table if not exists public.reality_check_events (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  stage reality_check_stage not null,
  decision text,
  decision_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists reality_check_events_task_id_idx on public.reality_check_events(task_id);

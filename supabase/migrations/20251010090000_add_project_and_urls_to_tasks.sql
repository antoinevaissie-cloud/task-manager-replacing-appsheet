alter table public.tasks
  add column if not exists project_id text,
  add column if not exists urls text[];

create index if not exists tasks_project_id_idx on public.tasks(project_id);

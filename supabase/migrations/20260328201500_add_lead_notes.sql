-- Lead notes for CRM workflow

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  note text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_notes_note_not_empty check (length(trim(note)) > 0)
);

create index if not exists idx_lead_notes_lead_id_created_at
  on public.lead_notes (lead_id, created_at desc);

drop trigger if exists trg_lead_notes_set_updated_at on public.lead_notes;
create trigger trg_lead_notes_set_updated_at
before update on public.lead_notes
for each row
execute function public.set_updated_at();

alter table public.lead_notes enable row level security;

drop policy if exists lead_notes_select_authenticated on public.lead_notes;
drop policy if exists lead_notes_insert_authenticated on public.lead_notes;
drop policy if exists lead_notes_update_authenticated on public.lead_notes;
drop policy if exists lead_notes_delete_authenticated on public.lead_notes;

create policy lead_notes_select_authenticated
  on public.lead_notes
  for select
  to authenticated
  using (true);

create policy lead_notes_insert_authenticated
  on public.lead_notes
  for insert
  to authenticated
  with check (true);

create policy lead_notes_update_authenticated
  on public.lead_notes
  for update
  to authenticated
  using (true)
  with check (true);

create policy lead_notes_delete_authenticated
  on public.lead_notes
  for delete
  to authenticated
  using (true);

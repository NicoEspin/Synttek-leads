-- Lead status history for CRM traceability

create table if not exists public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  previous_status public.lead_status,
  new_status public.lead_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  source text not null default 'api',
  note text,
  changed_at timestamptz not null default now(),
  constraint lead_status_history_source_check check (source in ('manual', 'system', 'api'))
);

create index if not exists idx_lead_status_history_lead_id_changed_at
  on public.lead_status_history (lead_id, changed_at desc);

create or replace function public.log_lead_status_change()
returns trigger
language plpgsql
as $$
declare
  jwt_sub text;
  actor_id uuid;
begin
  jwt_sub := nullif(current_setting('request.jwt.claim.sub', true), '');

  if jwt_sub is not null and jwt_sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    actor_id := jwt_sub::uuid;
  else
    actor_id := null;
  end if;

  if old.status is distinct from new.status then
    insert into public.lead_status_history (
      lead_id,
      previous_status,
      new_status,
      changed_by,
      source
    )
    values (
      new.id,
      old.status,
      new.status,
      actor_id,
      'api'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_log_lead_status_change on public.leads;
create trigger trg_log_lead_status_change
after update on public.leads
for each row
execute function public.log_lead_status_change();

alter table public.lead_status_history enable row level security;

drop policy if exists lead_status_history_select_authenticated on public.lead_status_history;
drop policy if exists lead_status_history_insert_authenticated on public.lead_status_history;

create policy lead_status_history_select_authenticated
  on public.lead_status_history
  for select
  to authenticated
  using (true);

create policy lead_status_history_insert_authenticated
  on public.lead_status_history
  for insert
  to authenticated
  with check (true);

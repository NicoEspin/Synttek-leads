-- Synttek Leads Engine - Initial schema (MVP)

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum (
      'nuevo',
      'revisado',
      'contactado',
      'respondio',
      'en_proceso',
      'descartado',
      'ganado'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'enrichment_status') then
    create type public.enrichment_status as enum ('pending', 'done', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_channel') then
    create type public.contact_channel as enum ('whatsapp', 'instagram', 'phone', 'email');
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_source') then
    create type public.contact_source as enum ('places_api', 'website_crawler', 'manual');
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_confidence') then
    create type public.contact_confidence as enum ('high', 'medium', 'low');
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_verification') then
    create type public.contact_verification as enum ('confirmed', 'candidate');
  end if;
end $$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique,
  name text not null,
  rubro_tecnico text,
  rubro_comercial text not null,
  city text not null,
  area text,
  address text,
  maps_url text,
  business_status text,
  phone_e164 text,
  website_url text,
  has_website boolean not null default false,
  rating numeric(2, 1),
  reviews_count integer not null default 0,
  whatsapp_url text,
  whatsapp_source public.contact_verification,
  instagram_url text,
  instagram_handle text,
  instagram_source public.contact_verification,
  enrichment_status public.enrichment_status not null default 'pending',
  score integer not null default 0,
  status public.lead_status not null default 'nuevo',
  notes text,
  assigned_to uuid references auth.users (id) on delete set null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_rating_range check (rating is null or (rating >= 1.0 and rating <= 5.0)),
  constraint leads_reviews_count_non_negative check (reviews_count >= 0),
  constraint leads_has_website_consistency check (has_website = false or website_url is not null)
);

create table if not exists public.search_runs (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  city text not null,
  rubro_comercial text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_found integer not null default 0,
  total_saved integer not null default 0,
  status text not null default 'running',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint search_runs_status_check check (status in ('running', 'completed', 'error')),
  constraint search_runs_total_found_non_negative check (total_found >= 0),
  constraint search_runs_total_saved_non_negative check (total_saved >= 0),
  constraint search_runs_finished_after_start check (finished_at is null or finished_at >= started_at)
);

create table if not exists public.lead_contacts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  channel public.contact_channel not null,
  value text not null,
  source public.contact_source not null,
  confidence public.contact_confidence not null default 'medium',
  is_primary boolean not null default false,
  is_confirmed boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint lead_contacts_unique_per_channel_value unique (lead_id, channel, value)
);

create index if not exists idx_leads_rubro_city on public.leads (rubro_comercial, city);
create index if not exists idx_leads_status_score on public.leads (status, score desc);
create index if not exists idx_leads_without_website on public.leads (city) where has_website = false;
create index if not exists idx_leads_enrichment_status on public.leads (enrichment_status);
create index if not exists idx_leads_updated_at on public.leads (updated_at desc);
create index if not exists idx_leads_phone_e164 on public.leads (phone_e164) where phone_e164 is not null;
create index if not exists idx_leads_instagram_handle on public.leads (instagram_handle) where instagram_handle is not null;

create index if not exists idx_search_runs_started_at on public.search_runs (started_at desc);
create index if not exists idx_search_runs_status on public.search_runs (status);

create index if not exists idx_lead_contacts_lead_channel on public.lead_contacts (lead_id, channel);
create index if not exists idx_lead_contacts_source on public.lead_contacts (source);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_set_updated_at on public.leads;
create trigger trg_leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

alter table public.leads enable row level security;
alter table public.search_runs enable row level security;
alter table public.lead_contacts enable row level security;

drop policy if exists leads_select_authenticated on public.leads;
drop policy if exists leads_insert_authenticated on public.leads;
drop policy if exists leads_update_authenticated on public.leads;
drop policy if exists leads_delete_authenticated on public.leads;

create policy leads_select_authenticated
  on public.leads
  for select
  to authenticated
  using (true);

create policy leads_insert_authenticated
  on public.leads
  for insert
  to authenticated
  with check (true);

create policy leads_update_authenticated
  on public.leads
  for update
  to authenticated
  using (true)
  with check (true);

create policy leads_delete_authenticated
  on public.leads
  for delete
  to authenticated
  using (true);

drop policy if exists search_runs_select_authenticated on public.search_runs;
drop policy if exists search_runs_insert_authenticated on public.search_runs;
drop policy if exists search_runs_update_authenticated on public.search_runs;
drop policy if exists search_runs_delete_authenticated on public.search_runs;

create policy search_runs_select_authenticated
  on public.search_runs
  for select
  to authenticated
  using (true);

create policy search_runs_insert_authenticated
  on public.search_runs
  for insert
  to authenticated
  with check (true);

create policy search_runs_update_authenticated
  on public.search_runs
  for update
  to authenticated
  using (true)
  with check (true);

create policy search_runs_delete_authenticated
  on public.search_runs
  for delete
  to authenticated
  using (true);

drop policy if exists lead_contacts_select_authenticated on public.lead_contacts;
drop policy if exists lead_contacts_insert_authenticated on public.lead_contacts;
drop policy if exists lead_contacts_update_authenticated on public.lead_contacts;
drop policy if exists lead_contacts_delete_authenticated on public.lead_contacts;

create policy lead_contacts_select_authenticated
  on public.lead_contacts
  for select
  to authenticated
  using (true);

create policy lead_contacts_insert_authenticated
  on public.lead_contacts
  for insert
  to authenticated
  with check (true);

create policy lead_contacts_update_authenticated
  on public.lead_contacts
  for update
  to authenticated
  using (true)
  with check (true);

create policy lead_contacts_delete_authenticated
  on public.lead_contacts
  for delete
  to authenticated
  using (true);

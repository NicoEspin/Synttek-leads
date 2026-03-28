-- MVP pre-auth mode: allow API operations before auth is implemented.
-- NOTE: tighten these policies when auth (item 19) is completed.

-- leads
drop policy if exists leads_select_authenticated on public.leads;
drop policy if exists leads_insert_authenticated on public.leads;
drop policy if exists leads_update_authenticated on public.leads;
drop policy if exists leads_delete_authenticated on public.leads;
drop policy if exists leads_select_public on public.leads;
drop policy if exists leads_insert_public on public.leads;
drop policy if exists leads_update_public on public.leads;
drop policy if exists leads_delete_public on public.leads;

create policy leads_select_public
  on public.leads
  for select
  to public
  using (true);

create policy leads_insert_public
  on public.leads
  for insert
  to public
  with check (true);

create policy leads_update_public
  on public.leads
  for update
  to public
  using (true)
  with check (true);

create policy leads_delete_public
  on public.leads
  for delete
  to public
  using (true);

-- search_runs
drop policy if exists search_runs_select_authenticated on public.search_runs;
drop policy if exists search_runs_insert_authenticated on public.search_runs;
drop policy if exists search_runs_update_authenticated on public.search_runs;
drop policy if exists search_runs_delete_authenticated on public.search_runs;
drop policy if exists search_runs_select_public on public.search_runs;
drop policy if exists search_runs_insert_public on public.search_runs;
drop policy if exists search_runs_update_public on public.search_runs;
drop policy if exists search_runs_delete_public on public.search_runs;

create policy search_runs_select_public
  on public.search_runs
  for select
  to public
  using (true);

create policy search_runs_insert_public
  on public.search_runs
  for insert
  to public
  with check (true);

create policy search_runs_update_public
  on public.search_runs
  for update
  to public
  using (true)
  with check (true);

create policy search_runs_delete_public
  on public.search_runs
  for delete
  to public
  using (true);

-- lead_contacts
drop policy if exists lead_contacts_select_authenticated on public.lead_contacts;
drop policy if exists lead_contacts_insert_authenticated on public.lead_contacts;
drop policy if exists lead_contacts_update_authenticated on public.lead_contacts;
drop policy if exists lead_contacts_delete_authenticated on public.lead_contacts;
drop policy if exists lead_contacts_select_public on public.lead_contacts;
drop policy if exists lead_contacts_insert_public on public.lead_contacts;
drop policy if exists lead_contacts_update_public on public.lead_contacts;
drop policy if exists lead_contacts_delete_public on public.lead_contacts;

create policy lead_contacts_select_public
  on public.lead_contacts
  for select
  to public
  using (true);

create policy lead_contacts_insert_public
  on public.lead_contacts
  for insert
  to public
  with check (true);

create policy lead_contacts_update_public
  on public.lead_contacts
  for update
  to public
  using (true)
  with check (true);

create policy lead_contacts_delete_public
  on public.lead_contacts
  for delete
  to public
  using (true);

-- lead_status_history
drop policy if exists lead_status_history_select_authenticated on public.lead_status_history;
drop policy if exists lead_status_history_insert_authenticated on public.lead_status_history;
drop policy if exists lead_status_history_select_public on public.lead_status_history;
drop policy if exists lead_status_history_insert_public on public.lead_status_history;

create policy lead_status_history_select_public
  on public.lead_status_history
  for select
  to public
  using (true);

create policy lead_status_history_insert_public
  on public.lead_status_history
  for insert
  to public
  with check (true);

-- lead_notes
drop policy if exists lead_notes_select_authenticated on public.lead_notes;
drop policy if exists lead_notes_insert_authenticated on public.lead_notes;
drop policy if exists lead_notes_update_authenticated on public.lead_notes;
drop policy if exists lead_notes_delete_authenticated on public.lead_notes;
drop policy if exists lead_notes_select_public on public.lead_notes;
drop policy if exists lead_notes_insert_public on public.lead_notes;
drop policy if exists lead_notes_update_public on public.lead_notes;
drop policy if exists lead_notes_delete_public on public.lead_notes;

create policy lead_notes_select_public
  on public.lead_notes
  for select
  to public
  using (true);

create policy lead_notes_insert_public
  on public.lead_notes
  for insert
  to public
  with check (true);

create policy lead_notes_update_public
  on public.lead_notes
  for update
  to public
  using (true)
  with check (true);

create policy lead_notes_delete_public
  on public.lead_notes
  for delete
  to public
  using (true);

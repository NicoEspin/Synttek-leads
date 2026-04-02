import type { LeadSearchCandidate } from "../places/client";
import { calculateLeadScore } from "./scoring";
import type { LeadStatus } from "./status";
import { createServiceRoleClient } from "../supabase/service-role";

type ContactVerification = "confirmed" | "candidate";
type ContactConfidence = "high" | "medium" | "low";

type LeadRowInsert = {
  place_id: string;
  name: string;
  rubro_tecnico: string | null;
  rubro_comercial: string;
  city: string;
  address: string | null;
  maps_url: string | null;
  business_status: string | null;
  phone_e164: string | null;
  website_url: string | null;
  has_website: boolean;
  whatsapp_url: string | null;
  whatsapp_source: ContactVerification | null;
  instagram_url: string | null;
  instagram_source: ContactVerification | null;
  rating: number | null;
  reviews_count: number;
  score: number;
  last_seen_at: string;
};

type SearchRunInsert = {
  query: string;
  city: string;
  rubro_comercial: string;
  total_found: number;
  total_saved: number;
  status: "running" | "completed" | "error";
};

type SearchRunUpdate = {
  finished_at: string;
  total_found: number;
  total_saved: number;
  status: "completed" | "error";
};

type SearchRunRow = {
  id: string;
};

type SavedLeadRow = {
  id: string;
  place_id: string;
};

type PersistResult = {
  totalSaved: number;
  savedPlaceIds: string[];
};

type ListLeadsSortBy = "updated_at" | "score" | "reviews_count" | "created_at";
type ListLeadsSortDir = "asc" | "desc";

export type LeadListItem = {
  id: string;
  placeId: string;
  businessName: string;
  rubroComercial: string;
  city: string;
  phoneE164: string | null;
  websiteUrl: string | null;
  hasWebsite: boolean;
  rating: number | null;
  reviewsCount: number;
  score: number;
  status: LeadStatus;
  mapsUrl: string | null;
  whatsappUrl: string | null;
  instagramUrl: string | null;
  enrichmentStatus: "pending" | "done" | "failed";
  updatedAt: string;
};

type LeadListRow = {
  id: string;
  place_id: string;
  name: string;
  rubro_comercial: string;
  city: string;
  phone_e164: string | null;
  website_url: string | null;
  has_website: boolean;
  rating: number | null;
  reviews_count: number;
  score: number;
  status: LeadStatus;
  maps_url: string | null;
  whatsapp_url: string | null;
  instagram_url: string | null;
  enrichment_status: "pending" | "done" | "failed";
  updated_at: string;
};

type ListLeadsInput = {
  page: number;
  pageSize: number;
  city?: string;
  rubroComercial?: string;
  phone?: string;
  status?: LeadStatus;
  excludeStatus?: LeadStatus;
  onlyWithoutWebsite?: boolean;
  onlyWithPhone?: boolean;
  sortBy: ListLeadsSortBy;
  sortDir: ListLeadsSortDir;
};

type ListLeadsResult = {
  rows: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
};

type LeadStatusUpdateRow = {
  id: string;
  status: LeadStatus;
};

type UpdateLeadStatusResult = {
  id: string;
  status: LeadStatus;
};

export type LeadStatusHistoryItem = {
  id: string;
  previousStatus: LeadStatus | null;
  newStatus: LeadStatus;
  source: "manual" | "system" | "api";
  note: string | null;
  changedAt: string;
  changedBy: string | null;
};

type LeadStatusHistoryRow = {
  id: string;
  previous_status: LeadStatus | null;
  new_status: LeadStatus;
  source: "manual" | "system" | "api";
  note: string | null;
  changed_at: string;
  changed_by: string | null;
};

export type LeadNoteItem = {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

type LeadNoteRow = {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type LeadMetricsOverview = {
  totalLeads: number;
  withoutWebsite: number;
  withWhatsapp: number;
  withInstagram: number;
  enrichmentPending: number;
  enrichmentDone: number;
  enrichmentFailed: number;
  statusContactado: number;
};

type ClientsOverview = {
  totalClients: number;
  revisado: number;
  contactado: number;
  respondio: number;
  enProceso: number;
  descartado: number;
  ganado: number;
};

export type LeadDetailContact = {
  id: string;
  channel: "whatsapp" | "instagram" | "phone" | "email";
  value: string;
  source: "places_api" | "website_crawler" | "manual";
  confidence: "high" | "medium" | "low";
  isPrimary: boolean;
  isConfirmed: boolean;
  createdAt: string;
};

export type LeadDetailItem = {
  id: string;
  placeId: string;
  businessName: string;
  rubroComercial: string;
  rubroTecnico: string | null;
  city: string;
  address: string | null;
  businessStatus: string | null;
  phoneE164: string | null;
  websiteUrl: string | null;
  hasWebsite: boolean;
  rating: number | null;
  reviewsCount: number;
  score: number;
  status: LeadStatus;
  mapsUrl: string | null;
  whatsappUrl: string | null;
  instagramUrl: string | null;
  instagramHandle: string | null;
  enrichmentStatus: "pending" | "done" | "failed";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: LeadDetailContact[];
};

type LeadDetailRow = {
  id: string;
  place_id: string;
  name: string;
  rubro_comercial: string;
  rubro_tecnico: string | null;
  city: string;
  address: string | null;
  business_status: string | null;
  phone_e164: string | null;
  website_url: string | null;
  has_website: boolean;
  rating: number | null;
  reviews_count: number;
  score: number;
  status: LeadStatus;
  maps_url: string | null;
  whatsapp_url: string | null;
  instagram_url: string | null;
  instagram_handle: string | null;
  enrichment_status: "pending" | "done" | "failed";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type LeadDetailContactRow = {
  id: string;
  channel: "whatsapp" | "instagram" | "phone" | "email";
  value: string;
  source: "places_api" | "website_crawler" | "manual";
  confidence: "high" | "medium" | "low";
  is_primary: boolean;
  is_confirmed: boolean;
  created_at: string;
};

type LeadForEnrichment = {
  id: string;
  websiteUrl: string;
};

type LeadForEnrichmentRow = {
  id: string;
  website_url: string | null;
};

type ApplyLeadEnrichmentInput = {
  leadId: string;
  whatsappUrl: string | null;
  whatsappSource: ContactVerification | null;
  instagramUrl: string | null;
  instagramHandle: string | null;
  instagramSource: ContactVerification | null;
  contacts: Array<{
    channel: "whatsapp" | "instagram";
    value: string;
    source: "website_crawler";
    confidence: ContactConfidence;
    isConfirmed: boolean;
  }>;
};

type LeadScoringContextRow = {
  name: string;
  rubro_comercial: string;
  has_website: boolean;
  phone_e164: string | null;
  rating: number | null;
  reviews_count: number;
  instagram_url: string | null;
};

function buildPhoneSearchCandidates(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) {
    return [];
  }

  const candidates = new Set<string>([digits]);

  if (digits.startsWith("549") && digits.length > 3) {
    const withoutMobilePrefix = `54${digits.slice(3)}`;
    candidates.add(withoutMobilePrefix);
    candidates.add(digits.slice(3));
  }

  if (digits.startsWith("54") && digits.length > 2) {
    candidates.add(digits.slice(2));

    const afterCountry = digits.slice(2);
    if (!afterCountry.startsWith("9")) {
      candidates.add(`549${afterCountry}`);
    }
  }

  return Array.from(candidates).filter((value) => value.length >= 8);
}

function dedupeByPlaceId(leads: LeadSearchCandidate[]) {
  const byPlaceId = new Map<string, LeadSearchCandidate>();
  for (const lead of leads) {
    byPlaceId.set(lead.placeId, lead);
  }

  return Array.from(byPlaceId.values());
}

function mapCandidateToLeadRow(candidate: LeadSearchCandidate, timestamp: string): LeadRowInsert {
  const score = calculateLeadScore({
    businessName: candidate.businessName,
    rubroComercial: candidate.rubroComercial,
    hasWebsite: candidate.hasWebsite,
    phoneE164: candidate.phoneE164,
    instagramUrl: candidate.instagramUrl,
    rating: candidate.rating,
    reviewsCount: candidate.reviewsCount,
  });

  return {
    place_id: candidate.placeId,
    name: candidate.businessName,
    rubro_tecnico: candidate.rubroTecnico,
    rubro_comercial: candidate.rubroComercial,
    city: candidate.city,
    address: candidate.address,
    maps_url: candidate.mapsUrl,
    business_status: candidate.businessStatus,
    phone_e164: candidate.phoneE164,
    website_url: candidate.websiteUrl,
    has_website: candidate.hasWebsite,
    whatsapp_url: candidate.whatsappUrl,
    whatsapp_source: candidate.whatsappUrl ? "candidate" : null,
    instagram_url: candidate.instagramUrl,
    instagram_source: candidate.instagramUrl ? "candidate" : null,
    rating: candidate.rating,
    reviews_count: candidate.reviewsCount,
    score,
    last_seen_at: timestamp,
  };
}

async function getLeadScoringContext(leadId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("leads")
    .select("name, rubro_comercial, has_website, phone_e164, rating, reviews_count, instagram_url")
    .eq("id", leadId)
    .single();

  if (error) {
    throw new Error(`Failed to load lead scoring context: ${error.message}`);
  }

  const row = data as LeadScoringContextRow | null;
  if (!row) {
    throw new Error("Failed to load lead scoring context: empty response");
  }

  return row;
}

function mapLeadListRow(row: LeadListRow): LeadListItem {
  return {
    id: row.id,
    placeId: row.place_id,
    businessName: row.name,
    rubroComercial: row.rubro_comercial,
    city: row.city,
    phoneE164: row.phone_e164,
    websiteUrl: row.website_url,
    hasWebsite: row.has_website,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    score: row.score,
    status: row.status,
    mapsUrl: row.maps_url,
    whatsappUrl: row.whatsapp_url,
    instagramUrl: row.instagram_url,
    enrichmentStatus: row.enrichment_status,
    updatedAt: row.updated_at,
  };
}

export async function createSearchRun(query: string, city: string, rubroComercial: string) {
  const supabase = createServiceRoleClient();

  const payload: SearchRunInsert = {
    query,
    city,
    rubro_comercial: rubroComercial,
    total_found: 0,
    total_saved: 0,
    status: "running",
  };

  const { data, error } = await supabase
    .from("search_runs")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create search run: ${error.message}`);
  }

  const row = data as SearchRunRow | null;
  if (!row?.id) {
    throw new Error("Failed to create search run: missing id in response");
  }

  return row.id;
}

export async function finalizeSearchRun(
  searchRunId: string,
  input: Omit<SearchRunUpdate, "finished_at">,
) {
  const supabase = createServiceRoleClient();

  const payload: SearchRunUpdate = {
    ...input,
    finished_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("search_runs").update(payload).eq("id", searchRunId);

  if (error) {
    throw new Error(`Failed to finalize search run: ${error.message}`);
  }
}

export async function persistLeadCandidates(candidates: LeadSearchCandidate[]): Promise<PersistResult> {
  const supabase = createServiceRoleClient();
  const timestamp = new Date().toISOString();

  const uniqueCandidates = dedupeByPlaceId(candidates);
  if (uniqueCandidates.length === 0) {
    return {
      totalSaved: 0,
      savedPlaceIds: [],
    };
  }

  const rows = uniqueCandidates.map((candidate) => mapCandidateToLeadRow(candidate, timestamp));

  const { data, error } = await supabase
    .from("leads")
    .upsert(rows, { onConflict: "place_id" })
    .select("id, place_id");

  if (error) {
    throw new Error(`Failed to persist leads: ${error.message}`);
  }

  const savedRows = (data ?? []) as SavedLeadRow[];

  return {
    totalSaved: savedRows.length,
    savedPlaceIds: savedRows.map((row) => row.place_id),
  };
}

export async function listLeads(input: ListLeadsInput): Promise<ListLeadsResult> {
  const supabase = createServiceRoleClient();

  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase
    .from("leads")
    .select(
      "id, place_id, name, rubro_comercial, city, phone_e164, website_url, has_website, rating, reviews_count, score, status, maps_url, whatsapp_url, instagram_url, enrichment_status, updated_at",
      { count: "exact" },
    )
    .order(input.sortBy, { ascending: input.sortDir === "asc" })
    .range(from, to);

  if (input.city) {
    query = query.ilike("city", `%${input.city}%`);
  }

  if (input.rubroComercial) {
    query = query.ilike("rubro_comercial", `%${input.rubroComercial}%`);
  }

  if (input.phone) {
    const phoneCandidates = buildPhoneSearchCandidates(input.phone);

    if (phoneCandidates.length > 0) {
      const phoneOrFilter = phoneCandidates
        .map((candidate) => `phone_e164.ilike.%${candidate}%`)
        .join(",");

      query = query.or(phoneOrFilter);
    }
  }

  if (input.status) {
    query = query.eq("status", input.status);
  } else if (input.excludeStatus) {
    query = query.neq("status", input.excludeStatus);
  }

  if (input.onlyWithoutWebsite) {
    query = query.eq("has_website", false);
  }

  if (input.onlyWithPhone) {
    query = query.not("phone_e164", "is", null);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to list leads: ${error.message}`);
  }

  const rows = (data ?? []) as LeadListRow[];

  return {
    rows: rows.map(mapLeadListRow),
    total: count ?? 0,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function listClients(input: Omit<ListLeadsInput, "excludeStatus">): Promise<ListLeadsResult> {
  return listLeads({
    ...input,
    excludeStatus: "nuevo",
  });
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<UpdateLeadStatusResult> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .select("id, status")
    .single();

  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`);
  }

  const row = data as LeadStatusUpdateRow | null;

  if (!row) {
    throw new Error("Failed to update lead status: empty response");
  }

  return {
    id: row.id,
    status: row.status,
  };
}

export async function listLeadStatusHistory(leadId: string, limit = 20): Promise<LeadStatusHistoryItem[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("lead_status_history")
    .select("id, previous_status, new_status, source, note, changed_at, changed_by")
    .eq("lead_id", leadId)
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list lead status history: ${error.message}`);
  }

  const rows = (data ?? []) as LeadStatusHistoryRow[];

  return rows.map((row) => ({
    id: row.id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    source: row.source,
    note: row.note,
    changedAt: row.changed_at,
    changedBy: row.changed_by,
  }));
}

export async function listLeadNotes(leadId: string, limit = 30): Promise<LeadNoteItem[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("lead_notes")
    .select("id, note, created_at, updated_at, created_by")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list lead notes: ${error.message}`);
  }

  const rows = (data ?? []) as LeadNoteRow[];

  return rows.map((row) => ({
    id: row.id,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  }));
}

export async function createLeadNote(leadId: string, note: string): Promise<LeadNoteItem> {
  const supabase = createServiceRoleClient();

  const payload = {
    lead_id: leadId,
    note: note.trim(),
  };

  const { data, error } = await supabase
    .from("lead_notes")
    .insert(payload)
    .select("id, note, created_at, updated_at, created_by")
    .single();

  if (error) {
    throw new Error(`Failed to create lead note: ${error.message}`);
  }

  const row = data as LeadNoteRow | null;
  if (!row) {
    throw new Error("Failed to create lead note: empty response");
  }

  return {
    id: row.id,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

export async function getLeadMetricsOverview(): Promise<LeadMetricsOverview> {
  const supabase = createServiceRoleClient();

  const [
    total,
    withoutWebsite,
    withWhatsapp,
    withInstagram,
    enrichmentPending,
    enrichmentDone,
    enrichmentFailed,
    statusContactado,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("has_website", false),
    supabase.from("leads").select("id", { count: "exact", head: true }).not("whatsapp_url", "is", null),
    supabase.from("leads").select("id", { count: "exact", head: true }).not("instagram_url", "is", null),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("enrichment_status", "pending"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("enrichment_status", "done"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("enrichment_status", "failed"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "contactado"),
  ]);

  const results = [
    { key: "total" as const, value: total },
    { key: "withoutWebsite" as const, value: withoutWebsite },
    { key: "withWhatsapp" as const, value: withWhatsapp },
    { key: "withInstagram" as const, value: withInstagram },
    { key: "enrichmentPending" as const, value: enrichmentPending },
    { key: "enrichmentDone" as const, value: enrichmentDone },
    { key: "enrichmentFailed" as const, value: enrichmentFailed },
    { key: "statusContactado" as const, value: statusContactado },
  ];

  for (const result of results) {
    if (result.value.error) {
      throw new Error(`Failed to load metrics (${result.key}): ${result.value.error.message}`);
    }
  }

  return {
    totalLeads: total.count ?? 0,
    withoutWebsite: withoutWebsite.count ?? 0,
    withWhatsapp: withWhatsapp.count ?? 0,
    withInstagram: withInstagram.count ?? 0,
    enrichmentPending: enrichmentPending.count ?? 0,
    enrichmentDone: enrichmentDone.count ?? 0,
    enrichmentFailed: enrichmentFailed.count ?? 0,
    statusContactado: statusContactado.count ?? 0,
  };
}

export async function getClientsOverview(): Promise<ClientsOverview> {
  const supabase = createServiceRoleClient();

  const [revisado, contactado, respondio, enProceso, descartado, ganado] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "revisado"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "contactado"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "respondio"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "en_proceso"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "descartado"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "ganado"),
  ]);

  const results = [
    { key: "revisado" as const, value: revisado },
    { key: "contactado" as const, value: contactado },
    { key: "respondio" as const, value: respondio },
    { key: "enProceso" as const, value: enProceso },
    { key: "descartado" as const, value: descartado },
    { key: "ganado" as const, value: ganado },
  ];

  for (const result of results) {
    if (result.value.error) {
      throw new Error(`Failed to load clients overview (${result.key}): ${result.value.error.message}`);
    }
  }

  return {
    totalClients:
      (revisado.count ?? 0) +
      (contactado.count ?? 0) +
      (respondio.count ?? 0) +
      (enProceso.count ?? 0) +
      (descartado.count ?? 0) +
      (ganado.count ?? 0),
    revisado: revisado.count ?? 0,
    contactado: contactado.count ?? 0,
    respondio: respondio.count ?? 0,
    enProceso: enProceso.count ?? 0,
    descartado: descartado.count ?? 0,
    ganado: ganado.count ?? 0,
  };
}

export async function getLeadDetail(leadId: string): Promise<LeadDetailItem | null> {
  const supabase = createServiceRoleClient();

  const [leadResult, contactsResult] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, place_id, name, rubro_comercial, rubro_tecnico, city, address, business_status, phone_e164, website_url, has_website, rating, reviews_count, score, status, maps_url, whatsapp_url, instagram_url, instagram_handle, enrichment_status, notes, created_at, updated_at",
      )
      .eq("id", leadId)
      .maybeSingle(),
    supabase
      .from("lead_contacts")
      .select("id, channel, value, source, confidence, is_primary, is_confirmed, created_at")
      .eq("lead_id", leadId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (leadResult.error) {
    throw new Error(`Failed to get lead detail: ${leadResult.error.message}`);
  }

  if (contactsResult.error) {
    throw new Error(`Failed to get lead contacts: ${contactsResult.error.message}`);
  }

  const lead = leadResult.data as LeadDetailRow | null;
  if (!lead) {
    return null;
  }

  const contacts = (contactsResult.data ?? []) as LeadDetailContactRow[];

  return {
    id: lead.id,
    placeId: lead.place_id,
    businessName: lead.name,
    rubroComercial: lead.rubro_comercial,
    rubroTecnico: lead.rubro_tecnico,
    city: lead.city,
    address: lead.address,
    businessStatus: lead.business_status,
    phoneE164: lead.phone_e164,
    websiteUrl: lead.website_url,
    hasWebsite: lead.has_website,
    rating: lead.rating,
    reviewsCount: lead.reviews_count,
    score: lead.score,
    status: lead.status,
    mapsUrl: lead.maps_url,
    whatsappUrl: lead.whatsapp_url,
    instagramUrl: lead.instagram_url,
    instagramHandle: lead.instagram_handle,
    enrichmentStatus: lead.enrichment_status,
    notes: lead.notes,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
    contacts: contacts.map((contact) => ({
      id: contact.id,
      channel: contact.channel,
      value: contact.value,
      source: contact.source,
      confidence: contact.confidence,
      isPrimary: contact.is_primary,
      isConfirmed: contact.is_confirmed,
      createdAt: contact.created_at,
    })),
  };
}

export async function listLeadsForStaticEnrichment(limit: number): Promise<LeadForEnrichment[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, website_url")
    .eq("has_website", true)
    .eq("enrichment_status", "pending")
    .not("website_url", "is", null)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list leads for enrichment: ${error.message}`);
  }

  const rows = (data ?? []) as LeadForEnrichmentRow[];

  return rows
    .filter((row) => Boolean(row.website_url))
    .map((row) => ({
      id: row.id,
      websiteUrl: row.website_url as string,
    }));
}

export async function listLeadsForDynamicEnrichment(limit: number): Promise<LeadForEnrichment[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, website_url")
    .eq("has_website", true)
    .eq("enrichment_status", "failed")
    .not("website_url", "is", null)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list leads for dynamic enrichment: ${error.message}`);
  }

  const rows = (data ?? []) as LeadForEnrichmentRow[];

  return rows
    .filter((row) => Boolean(row.website_url))
    .map((row) => ({
      id: row.id,
      websiteUrl: row.website_url as string,
    }));
}

export async function applyLeadEnrichmentResult(input: ApplyLeadEnrichmentInput) {
  const supabase = createServiceRoleClient();

  const scoringContext = await getLeadScoringContext(input.leadId);
  const score = calculateLeadScore({
    businessName: scoringContext.name,
    rubroComercial: scoringContext.rubro_comercial,
    hasWebsite: scoringContext.has_website,
    phoneE164: scoringContext.phone_e164,
    instagramUrl: input.instagramUrl ?? scoringContext.instagram_url,
    rating: scoringContext.rating,
    reviewsCount: scoringContext.reviews_count,
  });

  const { error: leadError } = await supabase
    .from("leads")
    .update({
      whatsapp_url: input.whatsappUrl,
      whatsapp_source: input.whatsappSource,
      instagram_url: input.instagramUrl,
      instagram_handle: input.instagramHandle,
      instagram_source: input.instagramSource,
      score,
      enrichment_status: "done",
    })
    .eq("id", input.leadId);

  if (leadError) {
    throw new Error(`Failed to apply enrichment to lead: ${leadError.message}`);
  }

  if (input.contacts.length > 0) {
    const contactRows = input.contacts.map((contact) => ({
      lead_id: input.leadId,
      channel: contact.channel,
      value: contact.value,
      source: contact.source,
      confidence: contact.confidence,
      is_primary: contact.isConfirmed,
      is_confirmed: contact.isConfirmed,
    }));

    const { error: contactError } = await supabase
      .from("lead_contacts")
      .upsert(contactRows, { onConflict: "lead_id,channel,value" });

    if (contactError) {
      throw new Error(`Failed to upsert lead contacts: ${contactError.message}`);
    }
  }
}

export async function markLeadEnrichmentFailed(leadId: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("leads")
    .update({ enrichment_status: "failed" })
    .eq("id", leadId);

  if (error) {
    throw new Error(`Failed to mark lead enrichment failed: ${error.message}`);
  }
}

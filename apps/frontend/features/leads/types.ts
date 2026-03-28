import type { LeadStatus } from "@/lib/leads/status";

export type LeadSearchCandidate = {
  placeId: string;
  source: "google_places";
  businessName: string;
  rubroTecnico: string | null;
  rubroComercial: string;
  city: string;
  address: string | null;
  mapsUrl: string | null;
  businessStatus: string | null;
  phoneE164: string | null;
  websiteUrl: string | null;
  hasWebsite: boolean;
  instagramUrl: string | null;
  whatsappUrl: string | null;
  rating: number | null;
  reviewsCount: number;
};

export type SearchLeadsRequest = {
  rubroComercial: string;
  city: string;
  keywords?: string;
  pageSize?: number;
  languageCode?: string;
  regionCode?: string;
};

export type SearchLeadsResponse = {
  searchRunId: string;
  query: string;
  totalFound: number;
  totalSaved: number;
  hasMore: boolean;
  savedPlaceIds: string[];
  leads: LeadSearchCandidate[];
};

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

export type ListLeadsRequest = {
  page?: number;
  pageSize?: number;
  city?: string;
  rubroComercial?: string;
  status?: LeadStatus;
  onlyWithoutWebsite?: boolean;
  onlyWithPhone?: boolean;
  sortBy?: "updated_at" | "score" | "reviews_count" | "created_at";
  sortDir?: "asc" | "desc";
};

export type ListLeadsResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  leads: LeadListItem[];
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

export type LeadNoteItem = {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type LeadMetricsOverview = {
  totalLeads: number;
  withoutWebsite: number;
  withWhatsapp: number;
  withInstagram: number;
  enrichmentPending: number;
  enrichmentDone: number;
  enrichmentFailed: number;
  statusContactado: number;
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

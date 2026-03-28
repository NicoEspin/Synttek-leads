import type { LeadNoteItem } from "@/features/leads/types";

type LeadNotesResponse = {
  leadId: string;
  total: number;
  items: LeadNoteItem[];
};

export async function getLeadNotes(leadId: string, limit = 30): Promise<LeadNotesResponse> {
  const response = await fetch(`/api/leads/${leadId}/notes?limit=${limit}`, {
    method: "GET",
  });

  const data = (await response.json()) as Partial<LeadNotesResponse> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to fetch lead notes");
  }

  return {
    leadId: data.leadId ?? leadId,
    total: data.total ?? 0,
    items: data.items ?? [],
  };
}

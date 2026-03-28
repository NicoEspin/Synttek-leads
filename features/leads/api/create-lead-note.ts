import type { LeadNoteItem } from "@/features/leads/types";

export async function createLeadNote(leadId: string, note: string): Promise<LeadNoteItem> {
  const response = await fetch(`/api/leads/${leadId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note }),
  });

  const data = (await response.json()) as Partial<LeadNoteItem> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to create lead note");
  }

  return {
    id: data.id ?? crypto.randomUUID(),
    note: data.note ?? note,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    createdBy: data.createdBy ?? null,
  };
}

import type { LeadStatusHistoryItem } from "@/features/leads/types";
import { getApiUrl } from "@/features/leads/api/api-base-url";

type LeadHistoryResponse = {
  leadId: string;
  total: number;
  items: LeadStatusHistoryItem[];
};

export async function getLeadHistory(leadId: string, limit = 20): Promise<LeadHistoryResponse> {
  const response = await fetch(getApiUrl(`/v1/leads/${leadId}/history?limit=${limit}`), {
    method: "GET",
  });

  const data = (await response.json()) as Partial<LeadHistoryResponse> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to fetch lead history");
  }

  return {
    leadId: data.leadId ?? leadId,
    total: data.total ?? 0,
    items: data.items ?? [],
  };
}

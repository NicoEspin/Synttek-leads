import { getApiUrl } from "@/features/leads/api/api-base-url";
import type { LeadDetailItem } from "@/features/leads/types";

type LeadDetailError = {
  message?: string;
  error?: string;
};

export async function getLeadDetail(leadId: string): Promise<LeadDetailItem | null> {
  const response = await fetch(getApiUrl(`/v1/leads/${leadId}`), {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const data = (await response.json()) as LeadDetailError;
    throw new Error(data.error ?? data.message ?? "Failed to fetch lead detail");
  }

  return (await response.json()) as LeadDetailItem;
}

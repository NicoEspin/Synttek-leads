import type { LeadStatus } from "@/lib/leads/status";
import { getApiUrl } from "@/features/leads/api/api-base-url";

type UpdateLeadStatusResponse = {
  id: string;
  status: LeadStatus;
};

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const response = await fetch(getApiUrl(`/v1/leads/${leadId}/status`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  const data = (await response.json()) as Partial<UpdateLeadStatusResponse> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to update lead status");
  }

  return {
    id: data.id ?? leadId,
    status: data.status ?? status,
  };
}
